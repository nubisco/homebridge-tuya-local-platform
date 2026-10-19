import MatterBaseAccessory from './MatterBase.accessory'
import type { MatterAccessoryDefinition } from './MatterBase.accessory'
import type { DPSState, HSBColor } from '../types'

// ColorControl.ColorMode
const COLOR_MODE_HUE_SATURATION = 0
const COLOR_MODE_TEMPERATURE = 2

// LevelControl.MoveMode and StepMode both use 0 for up and 1 for down.
const DIRECTION_DOWN = 1

/**
 * Dimmable, tunable white and colour lights: simpledimmer, simpledimmer2, twlight and
 * rgbtwlight. Which clusters a light gets follows from its type, the same DPs and
 * defaults the HomeKit accessory of that type uses.
 */
class LightMatterAccessory extends MatterBaseAccessory {
  dpPower!: string
  dpBrightness!: string
  dpColorTemperature?: string
  dpMode?: string
  dpColor?: string
  cmdWhite = 'white'
  cmdColor = 'colour'
  hasColor = false

  // Last colour the device reported or was sent, so a hue command followed by a
  // separate saturation command does not lose the first one before the device answers.
  _color: HSBColor = { h: 0, s: 0, b: 100 }

  _readDataPoints(): void {
    const context = this.device.context
    const type = (context.type || '').toLowerCase()
    const custom = (value: unknown) => this.codec._getCustomDP(value)

    this.dpPower = custom(context.dpPower) || '1'

    switch (type) {
      case 'simpledimmer':
        this.dpBrightness = custom(context.dpBrightness) || custom(context.dp) || '2'
        break
      case 'simpledimmer2':
        this.dpBrightness = '3'
        break
      case 'twlight':
        this.dpBrightness = custom(context.dpBrightness) || '2'
        this.dpColorTemperature = custom(context.dpColorTemperature) || '3'
        break
      case 'rgbtwlight': {
        this.hasColor = true
        this.dpMode = custom(context.dpMode) || '2'
        this.dpBrightness = custom(context.dpBrightness) || '3'
        this.dpColorTemperature = custom(context.dpColorTemperature) || '4'
        this.dpColor = custom(context.dpColor) || '5'
        if (context.cmdWhite && /^w[a-z]+$/i.test(context.cmdWhite)) this.cmdWhite = ('' + context.cmdWhite).trim()
        const cmdColor = context.cmdColor || context.cmdColour
        if (cmdColor && /^c[a-z]+$/i.test(cmdColor)) this.cmdColor = ('' + cmdColor).trim()
        break
      }
    }

    // The codec's colour conversions read this field when merging a partial colour.
    this.codec.dpColor = this.dpColor
  }

  _getDeviceType(): unknown {
    const { deviceTypes } = this.matter
    if (this.hasColor) return deviceTypes.ExtendedColorLight
    if (this.dpColorTemperature) return deviceTypes.ColorTemperatureLight
    return deviceTypes.DimmableLight
  }

  _isWhiteMode(state: DPSState = this.device.state): boolean {
    return !this.hasColor || state[this.dpMode] === this.cmdWhite
  }

  // The bulb's own white range, in mireds. Tuya counts from warm (0) to cool (scale).
  _miredsRange(): { min: number; max: number; scale: number } {
    const context = this.device.context as any
    return {
      min: context.minWhiteColor || 140,
      max: context.maxWhiteColor || 400,
      scale: context.scaleWhiteColor || 255,
    }
  }

  // Same reciprocal curve as the HomeKit conversion, minus HomeKit's slider offset:
  // Matter controllers are given the bulb's physical range directly.
  _miredsToTuya(mireds: number): number {
    const { min, max, scale } = this._miredsRange()
    const clamped = Math.min(max, Math.max(min, Number(mireds)))
    return Math.min(scale, Math.max(0, Math.round(((scale * min) / (max - min)) * (max / clamped - 1))))
  }

  _tuyaToMireds(value: unknown): number {
    const { min, max, scale } = this._miredsRange()
    const mireds = max / ((Number(value) * (max - min)) / (scale * min) + 1)
    return Math.min(max, Math.max(min, Math.round(mireds)))
  }

  _currentPercent(state: DPSState = this.device.state): number {
    if (this._isWhiteMode(state)) return this.codec.convertBrightnessFromTuyaToHomeKit(state[this.dpBrightness])
    return this.codec.convertColorFromTuyaToHomeKit(state[this.dpColor] as string).b
  }

  _brightnessDPs(percent: number): DPSState {
    if (this._isWhiteMode()) return { [this.dpBrightness]: this.codec.convertBrightnessFromHomeKitToTuya(percent) }

    this._color = { ...this._color, b: percent }
    return { [this.dpColor]: this.codec.convertColorFromHomeKitToTuya(this._color) }
  }

  _setLevel(level: number, withOnOff = false): void {
    if (withOnOff && level <= 1) return this._send({ [this.dpPower]: false })

    this._send({
      ...(withOnOff ? { [this.dpPower]: true } : {}),
      ...this._brightnessDPs(this._levelToPercent(level)),
    })
  }

  _setColor(color: Partial<HSBColor>): void {
    this._color = { ...this._color, ...color }
    this._send({
      [this.dpMode]: this.cmdColor,
      [this.dpColor]: this.codec.convertColorFromHomeKitToTuya(this._color),
    })
  }

  _getDefinition(): MatterAccessoryDefinition {
    this._readDataPoints()

    const state = this.device.state
    const clusters: Record<string, Record<string, unknown>> = {
      onOff: { onOff: this._coerceOnOff(state[this.dpPower]) },
      levelControl: {
        currentLevel: state.hasOwnProperty(this.dpBrightness) ? this._percentToLevel(this._currentPercent()) : 254,
        minLevel: 1,
        maxLevel: 254,
      },
    }

    const handlers: Record<string, Record<string, (...args: any[]) => unknown>> = {
      onOff: {
        on: () => this._send({ [this.dpPower]: true }),
        off: () => this._send({ [this.dpPower]: false }),
        toggle: () => this._send({ [this.dpPower]: !this._coerceOnOff(this.device.state[this.dpPower]) }),
      },
      levelControl: {
        moveToLevel: (args: any) => this._setLevel(args.level),
        moveToLevelWithOnOff: (args: any) => this._setLevel(args.level, true),
        step: (args: any) => {
          const current = this._percentToLevel(this._currentPercent())
          const delta = args.stepMode === DIRECTION_DOWN ? -args.stepSize : args.stepSize
          this._setLevel(Math.min(254, Math.max(1, current + delta)))
        },
        // A continuous ramp needs the device to follow a transition, which Tuya
        // devices do not take over LAN. Refusing it keeps Matter's state honest
        // instead of drifting away from the bulb.
        move: () => {
          throw new this.matter.status.InvalidAction('Continuous dimming is not supported by this device')
        },
        stop: () => undefined,
      },
    }

    if (this.dpColorTemperature) {
      const { min, max } = this._miredsRange()
      clusters.colorControl = {
        colorMode: COLOR_MODE_TEMPERATURE,
        colorTempPhysicalMinMireds: min,
        colorTempPhysicalMaxMireds: max,
        // Required by Matter whenever a light has colour temperature.
        coupleColorTempToLevelMinMireds: min,
        colorTemperatureMireds: state.hasOwnProperty(this.dpColorTemperature)
          ? this._tuyaToMireds(state[this.dpColorTemperature])
          : max,
      }
      handlers.colorControl = {
        moveToColorTemperatureLogic: (args: any) =>
          this._send({
            ...(this.hasColor ? { [this.dpMode]: this.cmdWhite } : {}),
            [this.dpColorTemperature]: this._miredsToTuya(args.colorTemperatureMireds),
          }),
        stopAllColorMovement: () => undefined,
      }
    }

    if (this.hasColor) {
      if (state.hasOwnProperty(this.dpColor))
        this._color = this.codec.convertColorFromTuyaToHomeKit(state[this.dpColor] as string)
      const [x, y] = hsToXy(this._color.h, this._color.s)

      Object.assign(clusters.colorControl, {
        colorMode: this._isWhiteMode() ? COLOR_MODE_TEMPERATURE : COLOR_MODE_HUE_SATURATION,
        currentHue: hueToMatter(this._color.h),
        currentSaturation: saturationToMatter(this._color.s),
        currentX: x,
        currentY: y,
      })
      Object.assign(handlers.colorControl, {
        moveToHueAndSaturationLogic: (args: any) =>
          this._setColor({ h: hueFromMatter(args.hue), s: saturationFromMatter(args.saturation) }),
        moveToHueLogic: (args: any) => this._setColor({ h: hueFromMatter(args.targetHue, args.isEnhancedHue) }),
        moveToSaturationLogic: (args: any) => this._setColor({ s: saturationFromMatter(args.targetSaturation) }),
        moveToColorLogic: (args: any) => this._setColor(xyToHs(args.targetX, args.targetY)),
      })
    }

    return { deviceType: this._getDeviceType(), clusters, handlers }
  }

  _onDeviceChange(changes: DPSState, state: DPSState): void {
    if (changes.hasOwnProperty(this.dpPower)) this._update('onOff', { onOff: this._coerceOnOff(changes[this.dpPower]) })

    const white = this._isWhiteMode(state)
    const modeChanged = this.hasColor && changes.hasOwnProperty(this.dpMode)

    if (changes.hasOwnProperty(white ? this.dpBrightness : this.dpColor) || modeChanged) {
      if (state.hasOwnProperty(white ? this.dpBrightness : this.dpColor))
        this._update('levelControl', { currentLevel: this._percentToLevel(this._currentPercent(state)) })
    }

    if (white && this.dpColorTemperature && (changes.hasOwnProperty(this.dpColorTemperature) || modeChanged)) {
      if (state.hasOwnProperty(this.dpColorTemperature))
        this._update('colorControl', {
          ...(this.hasColor ? { colorMode: COLOR_MODE_TEMPERATURE } : {}),
          colorTemperatureMireds: this._tuyaToMireds(state[this.dpColorTemperature]),
        })
    }

    if (!white && (changes.hasOwnProperty(this.dpColor) || modeChanged) && state.hasOwnProperty(this.dpColor)) {
      this._color = this.codec.convertColorFromTuyaToHomeKit(state[this.dpColor] as string)
      const [x, y] = hsToXy(this._color.h, this._color.s)
      this._update('colorControl', {
        colorMode: COLOR_MODE_HUE_SATURATION,
        currentHue: hueToMatter(this._color.h),
        currentSaturation: saturationToMatter(this._color.s),
        currentX: x,
        currentY: y,
      })
    }
  }
}

// Matter hue is 0 to 254 (or 0 to 65535 when enhanced), saturation 0 to 254. Tuya and
// HomeKit use degrees and percent.
export function hueToMatter(degrees: number): number {
  return Math.min(254, Math.max(0, Math.round((degrees * 254) / 360)))
}

export function hueFromMatter(value: number, enhanced = false): number {
  return Math.round((value * 360) / (enhanced ? 65535 : 254)) % 360
}

export function saturationToMatter(percent: number): number {
  return Math.min(254, Math.max(0, Math.round((percent * 254) / 100)))
}

export function saturationFromMatter(value: number): number {
  return Math.min(100, Math.max(0, Math.round((value * 100) / 254)))
}

// sRGB primaries with a D65 white point, which is what Matter's CIE xy assumes.
const gamma = (c: number) => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92)
const inverseGamma = (c: number) => (c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c)

/**
 * Hue (degrees) and saturation (percent) at full brightness to Matter's xy, where
 * 0 to 65535 stands for 0.0 to 1.0.
 */
export function hsToXy(hue: number, saturation: number): [number, number] {
  const s = saturation / 100
  const k = (n: number) => (n + hue / 60) % 6
  const [r, g, b] = [5, 3, 1].map((n) => gamma(1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1))))

  const X = r * 0.4124 + g * 0.3576 + b * 0.1805
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const Z = r * 0.0193 + g * 0.1192 + b * 0.9505
  const sum = X + Y + Z || 1

  return [Math.round((X / sum) * 65535), Math.round((Y / sum) * 65535)]
}

/**
 * Matter's xy back to hue (degrees) and saturation (percent).
 */
export function xyToHs(targetX: number, targetY: number): { h: number; s: number } {
  const x = targetX / 65535
  const y = Math.max(targetY / 65535, 1e-6)
  const X = x / y
  const Z = (1 - x - y) / y

  const linear = [
    X * 3.2406 - 1.5372 - Z * 0.4986,
    -X * 0.9689 + 1.8758 + Z * 0.0415,
    X * 0.0557 - 0.204 + Z * 1.057,
  ].map((c) => Math.max(0, c))
  const peak = Math.max(...linear) || 1
  const [r, g, b] = linear.map((c) => inverseGamma(c / peak))

  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }

  return { h: Math.round(h * 60) % 360, s: Math.round(max ? (d / max) * 100 : 0) }
}

export default LightMatterAccessory

import type {
  PlatformAccessory,
  Service as HAPService,
  Characteristic as HAPCharacteristic,
  WithUUID,
} from 'homebridge'
import type TuyaAccessory from '../protocol/TuyaAccessory'
import type { DPSState, DPSValue, HAPContext, HomebridgeCallback, HSBColor } from '../types'

class BaseAccessory {
  platform: any
  accessory: PlatformAccessory
  device: TuyaAccessory
  log: any
  hap: HAPContext
  colorFunction?: string
  dpColor!: string
  private __ret?: boolean

  constructor(...props: any[]) {
    let isNew: boolean
    ;[this.platform, this.accessory, this.device, isNew = true] = [...props]
    ;({
      log: this.log,
      api: { hap: this.hap },
    } = this.platform)

    if (isNew) this._registerPlatformAccessory()

    this.accessory.on('identify', ((paired: boolean, callback: () => void) => {
      this.log('%s - identify', this.device.context.name)
      callback()
    }) as any)

    this.device.once('connect', () => {
      this.log('Connected to', this.device.context.name)
    })

    this.device.once('change', () => {
      this.log(
        `Ready to handle ${this.device.context.name} (${this.device.context.type}:${this.device.context.version}) with signature ${JSON.stringify(this.device.state)}`,
      )

      this._registerCharacteristics(this.device.state)
    })

    this.device._connect()
  }

  _registerPlatformAccessory(): void {
    this.platform.registerPlatformAccessories(this.accessory)
  }

  _registerCharacteristics(_dps: DPSState): void {
    // Override in subclasses
  }

  _checkServiceName(service: HAPService, name: string): void {
    const { Characteristic } = this.hap

    if (service.displayName !== name) {
      const nameCharacteristic =
        service.getCharacteristic(Characteristic.Name) || service.addCharacteristic(Characteristic.Name)
      nameCharacteristic.setValue(name)
      service.displayName = name
    }
  }

  _removeCharacteristic(service: HAPService, characteristicType: WithUUID<new () => HAPCharacteristic>): void {
    if (!service || !characteristicType || !(characteristicType as any).UUID) return

    service.characteristics.some((characteristic) => {
      if (!characteristic || characteristic.UUID !== (characteristicType as any).UUID) return false
      service.removeCharacteristic(characteristic)
      return true
    })
  }

  _getCustomDP(numeral: unknown): string | false {
    return isFinite(numeral as number) && parseInt(numeral as string) > 0 ? String(numeral) : false
  }

  _coerceBoolean(b: unknown, defaultValue?: boolean): boolean {
    const df = defaultValue || false
    return typeof b === 'boolean'
      ? b
      : typeof b === 'string'
        ? b.toLowerCase().trim() === 'true'
        : typeof b === 'number'
          ? b !== 0
          : df
  }

  getState(dp: string | string[], callback: HomebridgeCallback): void {
    if (!this.device.connected) return callback(new Error('Not connected'))
    const _callback = () => {
      if (Array.isArray(dp)) {
        const ret: DPSState = {}
        dp.forEach((p) => {
          ret[p] = this.device.state[p]
        })
        callback(null, ret as any)
      } else {
        callback(null, this.device.state[dp])
      }
    }

    process.nextTick(_callback)
  }

  setState(dp: string, value: DPSValue, callback?: HomebridgeCallback): void {
    this.setMultiState({ [dp.toString()]: value }, callback)
  }

  setMultiStateLegacy(dps: DPSState, callback: HomebridgeCallback): void {
    if (!this.device.connected) return callback(new Error('Not connected'))
    const ret = this.device.update(dps)
    if (callback) callback(!ret ? new Error('Update failed') : null)
  }

  setMultiState(dps: DPSState, callback?: HomebridgeCallback): void {
    if (!this.device.connected) {
      if (callback) callback(new Error('Not connected'))
      return
    }
    for (const dp in dps) {
      if (dps.hasOwnProperty(dp) && dps[dp] !== this.device.state[dp]) {
        this.__ret = this.device.update({ [dp.toString()]: dps[dp] })
      }
    }
    if (callback) callback(!this.__ret ? new Error('Update failed') : null)
  }

  getDividedState(dp: string, divisor: number, callback: HomebridgeCallback): void {
    this.getState(dp, (err, data) => {
      if (err) return callback(err)
      if (!isFinite(data as number)) return callback(new Error('Invalid data'))

      callback(null, this._getDividedState(data as number, divisor))
    })
  }

  _getDividedState(dp: number | string, divisor: number): number {
    return parseFloat(dp as string) / divisor || 0
  }

  _detectColorFunction(value: string | undefined): void {
    this.colorFunction =
      this.device.context.colorFunction &&
      ({ HSB: 'HSB', HEXHSB: 'HEXHSB' } as Record<string, string>)[
        (this.device.context.colorFunction as string).toUpperCase()
      ]
    if (!this.colorFunction && value) {
      this.colorFunction = ({ 12: 'HSB', 14: 'HEXHSB' } as Record<number, string>)[value.length] || 'Unknown'
      if (this.colorFunction)
        this.log.info(
          `Color format for ${this.device.context.name} (${this.device.context.version}) identified as ${this.colorFunction} (length: ${value.length}).`,
        )
    }
    if (!this.colorFunction) {
      this.colorFunction = 'Unknown'
      this.log.info(`Color format for ${this.device.context.name} (${this.device.context.version}) is undetectable.`)
    } else if (this.colorFunction === 'HSB') {
      if (!this.device.context.scaleBrightness) (this.device.context as any).scaleBrightness = 1000
      if (!this.device.context.scaleWhiteColor) (this.device.context as any).scaleWhiteColor = 1000
    }
  }

  convertBrightnessFromHomeKitToTuya(value: number): number {
    const min = (this.device.context as any).minBrightness || 27
    const scale = (this.device.context as any).scaleBrightness || 255
    return Math.round(((scale - min) * value + 100 * min - scale) / 99)
  }

  convertBrightnessFromTuyaToHomeKit(value: number | string): number {
    const min = (this.device.context as any).minBrightness || 27
    const scale = (this.device.context as any).scaleBrightness || 255
    return Math.round((99 * (Number(value) || 0) - 100 * min + scale) / (scale - min))
  }

  convertRotationSpeedFromHomeKitToTuya(value: number): number | string {
    const max = (this.device.context as any).maxSpeed || 3
    const scale = Math.floor(100 / max)
    return Math.round(value / scale)
  }

  convertRotationSpeedFromTuyaToHomeKit(value: number | string): number {
    const max = (this.device.context as any).maxSpeed || 3
    const scale = Math.max(100 / max)
    return Math.round(Number(value) * scale)
  }

  convertColorTemperatureFromHomeKitToTuya(value: number): number {
    const min = (this.device.context as any).minWhiteColor || 140
    const max = (this.device.context as any).maxWhiteColor || 400
    const scale = (this.device.context as any).scaleWhiteColor || 255
    const adjustedValue = ((value - 71) * (max - min)) / (600 - 71) + 153
    const convertedValue = Math.round(((scale * min) / (max - min)) * (max / adjustedValue - 1))
    return Math.min(scale, Math.max(0, convertedValue))
  }

  convertColorTemperatureFromTuyaToHomeKit(value: number | string): number {
    const min = (this.device.context as any).minWhiteColor || 140
    const max = (this.device.context as any).maxWhiteColor || 400
    const scale = (this.device.context as any).scaleWhiteColor || 255
    const unadjustedValue = max / ((Number(value) * (max - min)) / (scale * min) + 1)
    const convertedValue = Math.round(((unadjustedValue - 153) * (600 - 71)) / (max - min) + 71)
    return Math.min(600, Math.max(71, convertedValue))
  }

  convertColorFromHomeKitToTuya(value: Partial<HSBColor>, dpValue?: string): string {
    switch ((this.device.context as any).colorFunction) {
      case 'HSB':
        return this.convertColorFromHomeKitToTuya_HSB(value, dpValue)
      default:
        return this.convertColorFromHomeKitToTuya_HEXHSB(value, dpValue)
    }
  }

  convertColorFromHomeKitToTuya_HEXHSB(value: Partial<HSBColor>, dpValue?: string): string {
    const cached = this.convertColorFromTuya_HEXHSB_ToHomeKit(dpValue || (this.device.state[this.dpColor] as string))
    const { h, s, b } = { ...cached, ...value }
    const hsb =
      h.toString(16).padStart(4, '0') +
      Math.round(2.55 * s)
        .toString(16)
        .padStart(2, '0') +
      Math.round(2.55 * b)
        .toString(16)
        .padStart(2, '0')
    const hNorm = h / 60
    const sNorm = s / 100
    const bNorm = b * 2.55

    const i = Math.floor(hNorm)
    const f = hNorm - i
    const p = bNorm * (1 - sNorm)
    const q = bNorm * (1 - sNorm * f)
    const t = bNorm * (1 - sNorm * (1 - f))
    const rgb = (() => {
      switch (i % 6) {
        case 0:
          return [bNorm, t, p]
        case 1:
          return [q, bNorm, p]
        case 2:
          return [p, bNorm, t]
        case 3:
          return [p, q, bNorm]
        case 4:
          return [t, p, bNorm]
        case 5:
          return [bNorm, p, q]
        default:
          return [bNorm, t, p]
      }
    })().map((c) => Math.round(c).toString(16).padStart(2, '0'))
    const hex = rgb.join('')

    return hex + hsb
  }

  convertColorFromHomeKitToTuya_HSB(value: Partial<HSBColor>, dpValue?: string): string {
    const cached = this.convertColorFromTuya_HSB_ToHomeKit(dpValue || (this.device.state[this.dpColor] as string))
    const { h, s, b } = { ...cached, ...value }
    return (
      h.toString(16).padStart(4, '0') + (10 * s).toString(16).padStart(4, '0') + (10 * b).toString(16).padStart(4, '0')
    )
  }

  convertColorFromTuyaToHomeKit(value: string): HSBColor {
    switch ((this.device.context as any).colorFunction) {
      case 'HSB':
        return this.convertColorFromTuya_HSB_ToHomeKit(value)
      default:
        return this.convertColorFromTuya_HEXHSB_ToHomeKit(value)
    }
  }

  convertColorFromTuya_HEXHSB_ToHomeKit(value: string): HSBColor {
    const [, h, s, b] = (value || '0000000000ffff').match(/^.{6}([0-9a-f]{4})([0-9a-f]{2})([0-9a-f]{2})$/i) || [
      '0',
      '0',
      'ff',
      'ff',
    ]
    return {
      h: parseInt(h, 16),
      s: Math.round(parseInt(s, 16) / 2.55),
      b: Math.round(parseInt(b, 16) / 2.55),
    }
  }

  convertColorFromTuya_HSB_ToHomeKit(value: string): HSBColor {
    const [, h, s, b] = (value || '000003e803e8').match(/^([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})$/i) || [
      '0',
      '0',
      '3e8',
      '3e8',
    ]
    return {
      h: parseInt(h, 16),
      s: Math.round(parseInt(s, 16) / 10),
      b: Math.round(parseInt(b, 16) / 10),
    }
  }

  convertHomeKitColorTemperatureToHomeKitColor(value: number): HSBColor {
    const dKelvin = 10000 / value
    const rgb = [
      dKelvin > 66
        ? 351.97690566805693 + 0.114206453784165 * (dKelvin - 55) - 40.25366309332127 * Math.log(dKelvin - 55)
        : 255,
      dKelvin > 66
        ? 325.4494125711974 + 0.07943456536662342 * (dKelvin - 50) - 28.0852963507957 * Math.log(dKelvin - 55)
        : 104.49216199393888 * Math.log(dKelvin - 2) - 0.44596950469579133 * (dKelvin - 2) - 155.25485562709179,
      dKelvin > 66
        ? 255
        : 115.67994401066147 * Math.log(dKelvin - 10) + 0.8274096064007395 * (dKelvin - 10) - 254.76935184120902,
    ].map((v) => Math.max(0, Math.min(255, v)) / 255)
    const max = Math.max(...rgb)
    const min = Math.min(...rgb)
    const d = max - min
    let h = 0
    const s = max ? (100 * d) / max : 0
    const b = 100 * max

    if (d) {
      switch (max) {
        case rgb[0]:
          h = (rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0)
          break
        case rgb[1]:
          h = (rgb[2] - rgb[0]) / d + 2
          break
        default:
          h = (rgb[0] - rgb[1]) / d + 4
          break
      }
      h *= 60
    }
    return {
      h: Math.round(h),
      s: Math.round(s),
      b: Math.round(b),
    }
  }

  adaptiveLightingSupport(): boolean {
    return !!(this.platform.api.versionGreaterOrEqual && this.platform.api.versionGreaterOrEqual('v1.3.0-beta.23'))
  }
}

export default BaseAccessory

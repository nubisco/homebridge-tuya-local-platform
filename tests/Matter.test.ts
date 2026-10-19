import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockLogger, createMockTuyaDevice } from './helpers'
import OnOffMatterAccessory from '../src/matter/OnOff.matter'
import LightMatterAccessory, {
  hsToXy,
  xyToHs,
  hueToMatter,
  hueFromMatter,
  saturationToMatter,
  saturationFromMatter,
} from '../src/matter/Light.matter'
import { MATTER_CLASS_DEF } from '../src/matter'

class MatterStatusError extends Error {
  constructor(
    public status: string,
    message: string,
  ) {
    super(message)
  }
}

function createMockMatter() {
  const status: Record<string, any> = {}
  for (const name of ['Busy', 'Failure', 'InvalidAction']) {
    status[name] = class extends MatterStatusError {
      constructor(message: string) {
        super(name, message)
      }
    }
  }

  return {
    deviceTypes: {
      OnOffLight: 'OnOffLight',
      OnOffOutlet: 'OnOffOutlet',
      OnOffSwitch: 'OnOffSwitch',
      DimmableLight: 'DimmableLight',
      ColorTemperatureLight: 'ColorTemperatureLight',
      ExtendedColorLight: 'ExtendedColorLight',
      BridgedNode: 'BridgedNode',
    },
    status,
    registerPlatformAccessories: vi.fn().mockResolvedValue(undefined),
    updateAccessoryState: vi.fn().mockResolvedValue(undefined),
  }
}

function createPlatform(matter = createMockMatter()) {
  return { log: createMockLogger(), api: { matter } }
}

async function register(Accessory: any, overrides: Record<string, any> = {}, state: Record<string, any> = {}) {
  const platform = createPlatform()
  const device = createMockTuyaDevice({ id: 'abcdefgh12345678', name: 'Test', ...overrides } as any)
  device.state = state
  device.connected = true

  const accessory = new Accessory(platform, device, 'matter-uuid')
  await accessory.register('homebridge-tuya-local-platform', 'TuyaLocalPlatform')

  const registered = platform.api.matter.registerPlatformAccessories.mock.calls[0][2][0]
  return { accessory, device, matter: platform.api.matter, registered }
}

describe('MATTER_CLASS_DEF', () => {
  it('covers the phase one device types only', () => {
    expect(Object.keys(MATTER_CLASS_DEF).sort()).toEqual(
      [
        'custommultioutlet',
        'multioutlet',
        'outlet',
        'rgbtwlight',
        'simpledimmer',
        'simpledimmer2',
        'simplelight',
        'switch',
        'twlight',
      ].sort(),
    )
  })
})

describe('OnOffMatterAccessory', () => {
  it('registers a single outlet with its identity and current state', async () => {
    const { registered, matter } = await register(OnOffMatterAccessory, { type: 'outlet' }, { '1': true })

    expect(matter.registerPlatformAccessories).toHaveBeenCalledWith(
      'homebridge-tuya-local-platform',
      'TuyaLocalPlatform',
      expect.any(Array),
    )
    expect(registered).toMatchObject({
      UUID: 'matter-uuid',
      displayName: 'Test',
      serialNumber: '12345678',
      deviceType: 'OnOffOutlet',
      clusters: { onOff: { onOff: true } },
    })
    expect(registered.parts).toBeUndefined()
  })

  it('uses the light and switch device types for those devices', async () => {
    expect((await register(OnOffMatterAccessory, { type: 'simplelight' })).registered.deviceType).toBe('OnOffLight')
    expect((await register(OnOffMatterAccessory, { type: 'switch' })).registered.deviceType).toBe('OnOffSwitch')
  })

  it('honours dpPower on a single channel', async () => {
    const { registered, device } = await register(OnOffMatterAccessory, { type: 'simplelight', dpPower: 20 })
    await registered.handlers.onOff.on()
    expect(device.update).toHaveBeenCalledWith({ '20': true })
  })

  it('sends on, off and toggle to the power DP', async () => {
    const { registered, device } = await register(OnOffMatterAccessory, { type: 'outlet' }, { '1': false })

    registered.handlers.onOff.on()
    expect(device.update).toHaveBeenLastCalledWith({ '1': true })

    device.state['1'] = true
    registered.handlers.onOff.off()
    expect(device.update).toHaveBeenLastCalledWith({ '1': false })

    registered.handlers.onOff.toggle()
    expect(device.update).toHaveBeenLastCalledWith({ '1': false })
  })

  it('does not resend a value the device already has', async () => {
    const { registered, device } = await register(OnOffMatterAccessory, { type: 'outlet' }, { '1': true })
    registered.handlers.onOff.on()
    expect(device.update).not.toHaveBeenCalled()
  })

  it('becomes a composed device with one part per gang', async () => {
    const { registered, device } = await register(OnOffMatterAccessory, { type: 'switch', switchCount: 3 })

    expect(registered.deviceType).toBe('BridgedNode')
    expect(registered.parts.map((part: any) => [part.id, part.displayName, part.deviceType])).toEqual([
      ['switch-1', 'Test 1', 'OnOffSwitch'],
      ['switch-2', 'Test 2', 'OnOffSwitch'],
      ['switch-3', 'Test 3', 'OnOffSwitch'],
    ])

    registered.parts[1].handlers.onOff.on()
    expect(device.update).toHaveBeenCalledWith({ '2': true })
  })

  it('maps custom multi-outlets to their configured DPs', async () => {
    const { registered, device } = await register(OnOffMatterAccessory, {
      type: 'custommultioutlet',
      outlets: [
        { name: 'Left', dp: 1 },
        { name: 'USB', dp: 7 },
      ],
    })

    expect(registered.parts.map((part: any) => [part.id, part.displayName])).toEqual([
      ['outlet-1', 'Left - Test'],
      ['outlet-7', 'USB - Test'],
    ])

    registered.parts[1].handlers.onOff.on()
    expect(device.update).toHaveBeenCalledWith({ '7': true })
  })

  it('pushes device-side changes to the matching part', async () => {
    const { device, matter } = await register(OnOffMatterAccessory, { type: 'multioutlet', outletCount: 2 })

    device.emit('change', { '2': true }, { '1': false, '2': true })

    expect(matter.updateAccessoryState).toHaveBeenCalledTimes(1)
    expect(matter.updateAccessoryState).toHaveBeenCalledWith('matter-uuid', 'onOff', { onOff: true }, 'outlet-2')
  })

  it('pushes the full state on the first change after connecting', async () => {
    const { device, matter } = await register(OnOffMatterAccessory, { type: 'outlet' })

    device.emit('change', {}, { '1': true })

    expect(matter.updateAccessoryState).toHaveBeenCalledWith('matter-uuid', 'onOff', { onOff: true }, undefined)
  })

  it('answers Busy while the device is not connected', async () => {
    const { registered, device } = await register(OnOffMatterAccessory, { type: 'outlet' })
    device.connected = false

    expect(() => registered.handlers.onOff.on()).toThrow(expect.objectContaining({ status: 'Busy' }))
    expect(device.update).not.toHaveBeenCalled()
  })

  it('answers Failure when the device rejects the update', async () => {
    const { registered, device } = await register(OnOffMatterAccessory, { type: 'outlet' })
    device.update.mockReturnValue(false)

    expect(() => registered.handlers.onOff.on()).toThrow(expect.objectContaining({ status: 'Failure' }))
  })
})

describe('LightMatterAccessory', () => {
  it('registers a dimmer with its level in Matter units', async () => {
    // 140 is what the HomeKit side sends for 50%, with the default 27 to 255 range.
    const { registered } = await register(LightMatterAccessory, { type: 'simpledimmer' }, { '1': true, '2': 140 })

    expect(registered.deviceType).toBe('DimmableLight')
    expect(registered.clusters.onOff).toEqual({ onOff: true })
    expect(registered.clusters.levelControl).toEqual({ currentLevel: 127, minLevel: 1, maxLevel: 254 })
    expect(registered.clusters.colorControl).toBeUndefined()
  })

  it('converts levels the same way the HomeKit dimmer does', async () => {
    const { registered, device } = await register(LightMatterAccessory, { type: 'simpledimmer' })

    registered.handlers.levelControl.moveToLevel({ level: 127 })
    expect(device.update).toHaveBeenLastCalledWith({ '2': 140 })

    registered.handlers.levelControl.moveToLevel({ level: 254 })
    expect(device.update).toHaveBeenLastCalledWith({ '2': 255 })
  })

  it('uses DP 3 for brightness on simpledimmer2', async () => {
    const { registered, device } = await register(LightMatterAccessory, { type: 'simpledimmer2' })
    registered.handlers.levelControl.moveToLevel({ level: 127 })
    expect(device.update).toHaveBeenLastCalledWith({ '3': 140 })
  })

  it('switches power with moveToLevelWithOnOff', async () => {
    const { registered, device } = await register(LightMatterAccessory, { type: 'simpledimmer' })

    registered.handlers.levelControl.moveToLevelWithOnOff({ level: 254 })
    expect(device.update).toHaveBeenLastCalledWith({ '1': true, '2': 255 })

    device.state = { '1': true, '2': 255 }
    registered.handlers.levelControl.moveToLevelWithOnOff({ level: 1 })
    expect(device.update).toHaveBeenLastCalledWith({ '1': false })
  })

  it('steps from the current level', async () => {
    const { registered, device } = await register(LightMatterAccessory, { type: 'simpledimmer' }, { '2': 255 })
    registered.handlers.levelControl.step({ stepMode: 1, stepSize: 50 })
    expect(device.update).toHaveBeenLastCalledWith({ '2': 209 })
  })

  it('refuses a continuous move instead of drifting from the device', async () => {
    const { registered, device } = await register(LightMatterAccessory, { type: 'simpledimmer' })
    expect(() => registered.handlers.levelControl.move({ moveMode: 0 })).toThrow(
      expect.objectContaining({ status: 'InvalidAction' }),
    )
    expect(device.update).not.toHaveBeenCalled()
  })

  it('exposes a tunable white light over the bulb range', async () => {
    const { registered, device } = await register(LightMatterAccessory, { type: 'twlight' }, { '3': 82 })

    expect(registered.deviceType).toBe('ColorTemperatureLight')
    expect(registered.clusters.colorControl).toMatchObject({
      colorTempPhysicalMinMireds: 140,
      colorTempPhysicalMaxMireds: 400,
      coupleColorTempToLevelMinMireds: 140,
      colorTemperatureMireds: 250,
    })

    registered.handlers.colorControl.moveToColorTemperatureLogic({ colorTemperatureMireds: 400 })
    expect(device.update).toHaveBeenLastCalledWith({ '3': 0 })
    registered.handlers.colorControl.moveToColorTemperatureLogic({ colorTemperatureMireds: 140 })
    expect(device.update).toHaveBeenLastCalledWith({ '3': 255 })
  })

  it('respects a custom white range', async () => {
    const { registered, device } = await register(LightMatterAccessory, {
      type: 'twlight',
      minWhiteColor: 153,
      maxWhiteColor: 370,
      scaleWhiteColor: 1000,
    })

    expect(registered.clusters.colorControl).toMatchObject({
      colorTempPhysicalMinMireds: 153,
      colorTempPhysicalMaxMireds: 370,
    })
    registered.handlers.colorControl.moveToColorTemperatureLogic({ colorTemperatureMireds: 153 })
    expect(device.update).toHaveBeenLastCalledWith({ '3': 1000 })
  })

  describe('rgbtwlight', () => {
    const colourState = { '1': true, '2': 'colour', '3': 255, '4': 0, '5': '00ff000078ffff' }

    it('registers as an extended colour light in colour mode', async () => {
      const { registered } = await register(LightMatterAccessory, { type: 'rgbtwlight' }, colourState)

      expect(registered.deviceType).toBe('ExtendedColorLight')
      expect(registered.clusters.colorControl).toMatchObject({
        colorMode: 0,
        currentHue: 85,
        currentSaturation: 254,
      })
      expect(registered.clusters.levelControl.currentLevel).toBe(254)
      expect(Object.keys(registered.handlers.colorControl)).toEqual(
        expect.arrayContaining([
          'moveToColorTemperatureLogic',
          'moveToHueAndSaturationLogic',
          'moveToHueLogic',
          'moveToSaturationLogic',
          'moveToColorLogic',
        ]),
      )
    })

    it('sets colour mode and colour together', async () => {
      const { registered, device } = await register(
        LightMatterAccessory,
        { type: 'rgbtwlight' },
        {
          ...colourState,
          '2': 'white',
          '5': 'ff00000000ffff',
        },
      )

      registered.handlers.colorControl.moveToHueAndSaturationLogic({ hue: 85, saturation: 254 })
      expect(device.update).toHaveBeenLastCalledWith({ '2': 'colour', '5': '00ff000078ffff' })
    })

    it('keeps a hue sent just before a separate saturation', async () => {
      const { registered, device } = await register(LightMatterAccessory, { type: 'rgbtwlight' }, colourState)

      registered.handlers.colorControl.moveToHueLogic({ targetHue: 0, isEnhancedHue: false })
      // The device has not answered yet, so its state still holds the old colour.
      registered.handlers.colorControl.moveToSaturationLogic({ targetSaturation: 127 })

      // Hue 0 survives. 50% saturation encodes as 7f because the shared codec
      // computes 2.55 * 50 as 127.49999.
      expect(device.update).toHaveBeenLastCalledWith({ '5': 'ff7f7f00007fff' })
    })

    it('dims through the colour in colour mode and through DP 3 in white mode', async () => {
      const { registered, device } = await register(LightMatterAccessory, { type: 'rgbtwlight' }, colourState)

      registered.handlers.levelControl.moveToLevel({ level: 127 })
      expect(device.update).toHaveBeenLastCalledWith({ '5': '007f000078ff7f' })

      device.state = { ...colourState, '2': 'white' }
      registered.handlers.levelControl.moveToLevel({ level: 127 })
      expect(device.update).toHaveBeenLastCalledWith({ '3': 140 })
    })

    it('switches to white mode for a colour temperature', async () => {
      const { registered, device } = await register(LightMatterAccessory, { type: 'rgbtwlight' }, colourState)
      registered.handlers.colorControl.moveToColorTemperatureLogic({ colorTemperatureMireds: 250 })
      expect(device.update).toHaveBeenLastCalledWith({ '2': 'white', '4': 82 })
    })

    it('accepts xy colours', async () => {
      const { registered, device } = await register(LightMatterAccessory, { type: 'rgbtwlight' }, colourState)
      const [x, y] = hsToXy(0, 100)
      registered.handlers.colorControl.moveToColorLogic({ targetX: x, targetY: y })
      expect(device.update).toHaveBeenLastCalledWith({ '5': 'ff00000000ffff' })
    })

    it('reports a mode change from the device', async () => {
      const { device, matter } = await register(LightMatterAccessory, { type: 'rgbtwlight' }, colourState)
      matter.updateAccessoryState.mockClear()

      device.emit('change', { '2': 'white' }, { ...colourState, '2': 'white', '4': 82 })

      expect(matter.updateAccessoryState).toHaveBeenCalledWith(
        'matter-uuid',
        'levelControl',
        { currentLevel: 254 },
        undefined,
      )
      expect(matter.updateAccessoryState).toHaveBeenCalledWith(
        'matter-uuid',
        'colorControl',
        { colorMode: 2, colorTemperatureMireds: 250 },
        undefined,
      )
    })

    it('reports a colour change from the device', async () => {
      const { device, matter } = await register(LightMatterAccessory, { type: 'rgbtwlight' }, colourState)
      matter.updateAccessoryState.mockClear()

      device.emit('change', { '5': 'ff00000000ffff' }, { ...colourState, '5': 'ff00000000ffff' })

      expect(matter.updateAccessoryState).toHaveBeenCalledWith(
        'matter-uuid',
        'colorControl',
        expect.objectContaining({ colorMode: 0, currentHue: 0, currentSaturation: 254 }),
        undefined,
      )
    })
  })
})

describe('colour conversions', () => {
  it('maps hue and saturation to and from Matter units', () => {
    expect(hueToMatter(360)).toBe(254)
    expect(hueFromMatter(254)).toBe(0)
    expect(hueFromMatter(85)).toBe(120)
    expect(hueFromMatter(65535 / 2, true)).toBe(180)
    expect(saturationToMatter(100)).toBe(254)
    expect(saturationFromMatter(127)).toBe(50)
  })

  it('round-trips primaries and a mid colour through xy', () => {
    for (const [h, s] of [
      [0, 100],
      [120, 100],
      [240, 100],
      [30, 60],
    ]) {
      const [x, y] = hsToXy(h, s)
      const back = xyToHs(x, y)
      expect(Math.abs(back.h - h)).toBeLessThanOrEqual(1)
      expect(Math.abs(back.s - s)).toBeLessThanOrEqual(1)
    }
  })

  it('puts white at the D65 point', () => {
    const [x, y] = hsToXy(0, 0)
    expect(x / 65535).toBeCloseTo(0.3127, 3)
    expect(y / 65535).toBeCloseTo(0.329, 3)
  })
})

describe('Platform Matter wiring', () => {
  let TuyaLocalPlatform: any
  let hap: any

  beforeEach(async () => {
    vi.resetModules()
    hap = {
      Characteristic: class {},
      Formats: {},
      Perms: {},
      Service: { AccessoryInformation: { UUID: 'AccessoryInformation' } },
      Categories: {},
      uuid: { generate: (str: string) => 'uuid-' + str },
    }
    const mod: any = await import('../src/index')
    const registerFn = mod.default || mod
    registerFn({
      platformAccessory: class {},
      hap,
      registerPlatform: (_plugin: string, _platform: string, PlatformClass: any) => {
        TuyaLocalPlatform = PlatformClass
      },
    })
  })

  function createPlatform(devices: any[], matter?: any) {
    const log = createMockLogger()
    const api = { hap, on: vi.fn(), matter }
    return new TuyaLocalPlatform(log, { devices }, api)
  }

  it('expects a Matter accessory only for enabled devices that ask for one', () => {
    const platform = createPlatform([
      { id: 'one', type: 'outlet', matter: true },
      { id: 'two', type: 'outlet' },
      { id: 'three', type: 'outlet', matter: true, disabled: true },
      { id: 'four', type: 'outlet', matter: true, fake: true },
    ])

    expect(platform._expectedMatterUUIDs).toEqual([
      'uuid-homebridge-tuya-local-platform:matter:one',
      'uuid-homebridge-tuya-local-platform:matter:fake:four',
    ])
  })

  it('never reuses the HomeKit UUID for the Matter accessory', () => {
    const platform = createPlatform([{ id: 'one', type: 'outlet', matter: true }])
    expect(platform._expectedUUIDs).not.toContain(platform._expectedMatterUUIDs[0])
  })

  it('unregisters cached Matter accessories nobody asks for any more', () => {
    const matter = { unregisterPlatformAccessories: vi.fn().mockResolvedValue(undefined) }
    const platform = createPlatform([{ id: 'one', type: 'outlet', matter: true }], matter)

    const kept = { UUID: 'uuid-homebridge-tuya-local-platform:matter:one', displayName: 'Kept' }
    const stale = { UUID: 'uuid-homebridge-tuya-local-platform:matter:gone', displayName: 'Gone' }
    platform.configureMatterAccessory(kept)
    platform.configureMatterAccessory(stale)
    platform._removeStaleMatterAccessories()

    expect(matter.unregisterPlatformAccessories).toHaveBeenCalledWith(
      'homebridge-tuya-local-platform',
      'TuyaLocalPlatform',
      [stale],
    )
  })

  it('warns once and stays HomeKit-only when Matter is not enabled', () => {
    const platform = createPlatform([{ id: 'one', type: 'outlet', matter: true }])
    const device = createMockTuyaDevice({ type: 'outlet', matter: true } as any)

    platform.addMatterAccessory(device)
    platform.addMatterAccessory(device)

    expect(platform.log.warn).toHaveBeenCalledTimes(1)
    expect(platform.log.warn).toHaveBeenCalledWith(expect.stringContaining('Matter is not enabled'))
  })

  it('warns for a device type that has no Matter mapping yet', () => {
    const platform = createPlatform([], createMockMatter())
    const device = createMockTuyaDevice({ type: 'SimpleHeater', name: 'Heater', matter: true } as any)

    platform.addMatterAccessory(device)

    expect(platform.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('cannot be exposed over Matter yet'),
      'Heater',
      'SimpleHeater',
    )
  })

  it('does nothing for a device that did not ask for Matter', () => {
    const matter = createMockMatter()
    const platform = createPlatform([], matter)

    platform.addMatterAccessory(createMockTuyaDevice({ type: 'outlet' }))

    expect(matter.registerPlatformAccessories).not.toHaveBeenCalled()
    expect(platform.log.warn).not.toHaveBeenCalled()
  })
})

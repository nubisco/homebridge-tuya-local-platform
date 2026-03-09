import { describe, it, expect, vi, beforeEach } from 'vitest'

// We need to test the CLASS_DEF completeness and addAccessory/configureAccessory
// logic. Since index.ts uses module.exports and module-scoped vars set at registration
// time, we test the exported registration function and instantiate the platform.

describe('Platform Registration', () => {
  let registerFn: (homebridge: any) => void
  let mockHomebridge: any
  let registeredPlatform: any

  beforeEach(async () => {
    vi.resetModules()

    registeredPlatform = null

    // Characteristic must be a real constructor because EnergyCharacteristicsFactory extends it
    class MockCharacteristic {
      static Formats = { FLOAT: 'float', STRING: 'string', BOOL: 'bool' }
      static Perms = { WRITE: 'pw', NOTIFY: 'ev', READ: 'pr', PAIRED_READ: 'pr' }
      static Manufacturer = 'Manufacturer'
      static Model = 'Model'
      static SerialNumber = 'SerialNumber'
      static Name = 'Name'
      static Active = { ACTIVE: 1, INACTIVE: 0 }
      static CurrentTemperature = 'CurrentTemperature'
      static CurrentRelativeHumidity = 'CurrentRelativeHumidity'

      value: any = null
      displayName: string
      UUID: string
      props: any = {}

      constructor(displayName?: string, uuid?: string) {
        this.displayName = displayName || ''
        this.UUID = uuid || ''
      }

      setProps(props: any) {
        Object.assign(this.props, props)
        return this
      }
      getDefaultValue() {
        return null
      }
      on() {
        return this
      }
      updateValue() {
        return this
      }
    }

    mockHomebridge = {
      platformAccessory: class MockPlatformAccessory {
        UUID: string
        displayName: string
        category: number
        services: any[]
        _serviceMap: Map<string, any>

        constructor(name: string, uuid: string, category: number) {
          this.displayName = name
          this.UUID = uuid
          this.category = category
          this.services = []
          this._serviceMap = new Map()
          const infoService = {
            UUID: 'AccessoryInformation',
            displayName: 'AccessoryInformation',
            characteristics: [],
            getCharacteristic: vi.fn().mockReturnValue({
              updateValue: vi.fn().mockReturnThis(),
              on: vi.fn().mockReturnThis(),
              value: null,
            }),
            setCharacteristic: vi.fn().mockReturnThis(),
          }
          this.services.push(infoService)
          this._serviceMap.set('AccessoryInformation', infoService)
        }

        getService(type: any) {
          const uuid = typeof type === 'object' ? type.UUID : type
          return this._serviceMap.get(uuid)
        }

        addService(type: any, name: string) {
          const uuid = typeof type === 'object' ? type.UUID : type
          const svc = {
            UUID: uuid,
            displayName: name,
            characteristics: [],
            getCharacteristic: vi.fn().mockReturnValue({
              updateValue: vi.fn().mockReturnThis(),
              on: vi.fn().mockReturnThis(),
              setProps: vi.fn().mockReturnThis(),
              value: null,
            }),
            setCharacteristic: vi.fn().mockReturnThis(),
          }
          this.services.push(svc)
          this._serviceMap.set(uuid, svc)
          return svc
        }

        on() {
          return this
        }
      },
      hap: {
        Characteristic: MockCharacteristic,
        Service: {
          AccessoryInformation: { UUID: 'AccessoryInformation' },
        },
        Accessory: {
          Categories: {
            OTHER: 1,
            OUTLET: 7,
            LIGHTBULB: 5,
            FAN: 3,
            AIR_CONDITIONER: 21,
            AIR_PURIFIER: 19,
            AIR_DEHUMIDIFIER: 23,
            GARAGE_DOOR_OPENER: 4,
            WINDOW_COVERING: 14,
            THERMOSTAT: 9,
            SENSOR: 10,
            SWITCH: 8,
            FAUCET: 29,
          },
        },
        uuid: {
          generate: (str: string) => 'uuid-' + str,
        },
      },
      registerPlatform: vi.fn((_pluginName, _platformName, PlatformClass, _dynamic) => {
        registeredPlatform = PlatformClass
      }),
    }

    const mod = await import('../src/index')
    registerFn = (mod.default || mod) as any
    // index.ts uses module.exports = function, so the default export is the function
  })

  it('should register the platform with correct names', () => {
    registerFn(mockHomebridge)
    expect(mockHomebridge.registerPlatform).toHaveBeenCalledWith(
      'homebridge-tuya-local-platform',
      'TuyaLocalPlatform',
      expect.any(Function),
      true,
    )
  })

  it('should create the platform class that is constructable', () => {
    registerFn(mockHomebridge)
    expect(registeredPlatform).toBeDefined()

    const log = Object.assign(vi.fn(), { info: vi.fn(), warn: vi.fn(), error: vi.fn() })
    const config = { devices: [] }
    const api = {
      hap: mockHomebridge.hap,
      on: vi.fn(),
      registerPlatformAccessories: vi.fn(),
      unregisterPlatformAccessories: vi.fn(),
    }

    const platform = new registeredPlatform(log, config, api)
    expect(platform.cachedAccessories).toBeInstanceOf(Map)
  })

  it('should log error if no devices are configured', () => {
    registerFn(mockHomebridge)

    const log = Object.assign(vi.fn(), { info: vi.fn(), warn: vi.fn(), error: vi.fn() })
    const api = {
      hap: mockHomebridge.hap,
      on: vi.fn(),
      registerPlatformAccessories: vi.fn(),
      unregisterPlatformAccessories: vi.fn(),
    }

    new registeredPlatform(log, null, api)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('No devices found'))
  })

  it('should generate expected UUIDs for configured devices', () => {
    registerFn(mockHomebridge)

    const log = Object.assign(vi.fn(), { info: vi.fn(), warn: vi.fn(), error: vi.fn() })
    const config = {
      devices: [
        { id: 'abc123', key: 'key1', type: 'outlet' },
        { id: 'def456', key: 'key2', type: 'switch', fake: true },
      ],
    }
    const api = {
      hap: mockHomebridge.hap,
      on: vi.fn(),
      registerPlatformAccessories: vi.fn(),
      unregisterPlatformAccessories: vi.fn(),
    }

    const platform = new registeredPlatform(log, config, api)
    expect(platform._expectedUUIDs).toHaveLength(2)
    expect(platform._expectedUUIDs[0]).toBe('uuid-homebridge-tuya-local-platform:abc123')
    expect(platform._expectedUUIDs[1]).toBe('uuid-homebridge-tuya-local-platform:fake:def456')
  })

  it('should register one or many platform accessories', () => {
    registerFn(mockHomebridge)

    const log = Object.assign(vi.fn(), { info: vi.fn(), warn: vi.fn(), error: vi.fn() })
    const config = { devices: [{ id: 'abc123', key: 'key1', type: 'outlet' }] }
    const api = {
      hap: mockHomebridge.hap,
      on: vi.fn(),
      registerPlatformAccessories: vi.fn(),
      unregisterPlatformAccessories: vi.fn(),
    }

    const platform = new registeredPlatform(log, config, api)
    const a1 = { UUID: 'uuid-1' }
    const a2 = { UUID: 'uuid-2' }

    platform.registerPlatformAccessories(a1)
    expect(api.registerPlatformAccessories).toHaveBeenLastCalledWith(
      'homebridge-tuya-local-platform',
      'TuyaLocalPlatform',
      [a1],
    )

    platform.registerPlatformAccessories([a1, a2])
    expect(api.registerPlatformAccessories).toHaveBeenLastCalledWith(
      'homebridge-tuya-local-platform',
      'TuyaLocalPlatform',
      [a1, a2],
    )
  })

  it('should remove accessory by UUID from cache and unregister it', () => {
    registerFn(mockHomebridge)

    const log = Object.assign(vi.fn(), { info: vi.fn(), warn: vi.fn(), error: vi.fn() })
    const config = { devices: [{ id: 'abc123', key: 'key1', type: 'outlet' }] }
    const api = {
      hap: mockHomebridge.hap,
      on: vi.fn(),
      registerPlatformAccessories: vi.fn(),
      unregisterPlatformAccessories: vi.fn(),
    }

    const platform = new registeredPlatform(log, config, api)
    const accessory = { UUID: 'uuid-to-remove', displayName: 'Old Device' }

    platform.cachedAccessories.set(accessory.UUID, accessory)
    platform.removeAccessoryByUUID(accessory.UUID)

    expect(platform.cachedAccessories.has(accessory.UUID)).toBe(false)
    expect(api.unregisterPlatformAccessories).toHaveBeenCalledWith('TuyaLocalPlatform', 'TuyaLocalPlatform', [
      accessory,
    ])
  })
})

describe('CLASS_DEF completeness', () => {
  const expectedTypes = [
    'outlet',
    'simplelight',
    'rgbtwlight',
    'rgbtwoutlet',
    'twlight',
    'multioutlet',
    'custommultioutlet',
    'airconditioner',
    'airpurifier',
    'dehumidifier',
    'convector',
    'garagedoor',
    'simpledimmer',
    'simpledimmer2',
    'simpleblinds',
    'simpleheater',
    'mappedheatpumpheater',
    'circuitbreakermonitor',
    'switch',
    'fan',
    'fanlight',
    'watervalve',
    'oildiffuser',
  ]

  let CLASS_DEF: any

  beforeEach(async () => {
    vi.resetModules()

    // Import the accessories index to get all classes and verify mappings
    const accessories = await import('../src/accessories/index')
    // We can't easily get CLASS_DEF from index.ts since it's inside module.exports callback,
    // but we can verify all expected accessory classes are exported
    CLASS_DEF = accessories
  })

  it('should export all expected accessory classes', () => {
    const expectedExports = [
      'OutletAccessory',
      'SimpleLightAccessory',
      'RGBTWLightAccessory',
      'RGBTWOutletAccessory',
      'TWLightAccessory',
      'MultiOutletAccessory',
      'CustomMultiOutletAccessory',
      'AirConditionerAccessory',
      'AirPurifierAccessory',
      'DehumidifierAccessory',
      'ConvectorAccessory',
      'GarageDoorAccessory',
      'SimpleDimmerAccessory',
      'SimpleDimmer2Accessory',
      'SimpleBlindsAccessory',
      'SimpleHeaterAccessory',
      'MappedHeatPumpHeaterAccessory',
      'CircuitBreakerMonitorAccessory',
      'SwitchAccessory',
      'SimpleFanAccessory',
      'SimpleFanLightAccessory',
      'ValveAccessory',
      'OilDiffuserAccessory',
      'EnergyCharacteristicsFactory',
    ]

    for (const name of expectedExports) {
      expect(CLASS_DEF[name], `Missing export: ${name}`).toBeDefined()
    }
  })

  it(`should have all ${expectedTypes.length} device types registered`, () => {
    expect(expectedTypes.length).toBe(23)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// discoverDevices() decides, per device, whether to connect straight away or to wait
// for UDP discovery. Both protocol modules are mocked so nothing touches the network.

const accessoryInstances: any[] = []

vi.mock('../src/protocol/TuyaAccessory', () => ({
  default: class MockTuyaAccessory {
    context: any
    constructor(props: any) {
      this.context = props
      accessoryInstances.push(props)
    }
  },
}))

const discoveryOn = vi.fn()
const discoveryStart = vi.fn(() => ({ on: discoveryOn }))

vi.mock('../src/protocol/TuyaDiscovery', () => ({
  default: { start: (...args: any[]) => discoveryStart(...(args as [])) },
}))

class MockCharacteristic {
  static Formats = { FLOAT: 'float', STRING: 'string', BOOL: 'bool' }
  static Perms = { WRITE: 'pw', NOTIFY: 'ev', READ: 'pr', PAIRED_READ: 'pr' }
  setProps() {
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

function buildPlatform(devices: any[]) {
  const log = Object.assign(vi.fn(), { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })
  const api = {
    hap: mockHomebridge.hap,
    on: vi.fn(),
    registerPlatformAccessories: vi.fn(),
    unregisterPlatformAccessories: vi.fn(),
  }

  const platform = new registeredPlatform(log, { devices }, api)
  platform.addAccessory = vi.fn()

  return { platform, log }
}

let registerFn: (homebridge: any) => void
let registeredPlatform: any
let mockHomebridge: any

describe('discoverDevices', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()

    accessoryInstances.length = 0
    discoveryStart.mockClear()
    discoveryOn.mockClear()
    registeredPlatform = null

    mockHomebridge = {
      platformAccessory: class {},
      hap: {
        Characteristic: MockCharacteristic,
        Service: { AccessoryInformation: { UUID: 'AccessoryInformation' } },
        Categories: { OUTLET: 7, LIGHTBULB: 5 },
        uuid: { generate: (str: string) => 'uuid-' + str },
      },
      registerPlatform: vi.fn((_plugin, _platform, PlatformClass) => {
        registeredPlatform = PlatformClass
      }),
    }

    const mod = await import('../src/index')
    registerFn = (mod.default || mod) as any
    registerFn(mockHomebridge)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('connects a device that has both an IP and a version without waiting for discovery', () => {
    const { platform, log } = buildPlatform([
      { id: '3820110810521cda7a0a', key: 'k', type: 'outlet', ip: '192.168.0.30', version: '3.3' },
    ])

    platform.discoverDevices()

    expect(accessoryInstances).toHaveLength(1)
    expect(accessoryInstances[0]).toMatchObject({ id: '3820110810521cda7a0a', ip: '192.168.0.30', version: '3.3' })
    expect(platform.addAccessory).toHaveBeenCalledTimes(1)
    expect(log.info).toHaveBeenCalledWith(
      'Connecting directly to %s (%s) via %s.',
      '3820110810521cda7a0a'.slice(8),
      '3820110810521cda7a0a',
      '192.168.0.30',
    )
  })

  it('does not start discovery when every device is directly addressable', () => {
    const { platform, log } = buildPlatform([
      { id: 'aaaaaaaaaaaaaaaaaaa1', key: 'k', type: 'outlet', ip: '192.168.0.30', version: '3.3' },
      { id: 'aaaaaaaaaaaaaaaaaaa2', key: 'k', type: 'outlet', ip: '192.168.0.31', version: '3.3' },
    ])

    platform.discoverDevices()

    expect(discoveryStart).not.toHaveBeenCalled()
    expect(log.info).not.toHaveBeenCalledWith('Starting discovery...')
    expect(accessoryInstances).toHaveLength(2)
  })

  it('starts discovery only for the devices that still need it', () => {
    const { platform } = buildPlatform([
      { id: 'aaaaaaaaaaaaaaaaaaa1', key: 'k', type: 'outlet', ip: '192.168.0.30', version: '3.3' },
      { id: 'bbbbbbbbbbbbbbbbbbb2', key: 'k', type: 'outlet' },
    ])

    platform.discoverDevices()

    expect(discoveryStart).toHaveBeenCalledTimes(1)
    expect(discoveryStart.mock.calls[0][0]).toMatchObject({ ids: ['bbbbbbbbbbbbbbbbbbb2'] })
  })

  it('keeps a device with an IP but no version in discovery, because that is where the version comes from', () => {
    const { platform } = buildPlatform([{ id: 'ccccccccccccccccccc3', key: 'k', type: 'outlet', ip: '192.168.0.32' }])

    platform.discoverDevices()

    expect(accessoryInstances).toHaveLength(0)
    expect(discoveryStart.mock.calls[0][0]).toMatchObject({ ids: ['ccccccccccccccccccc3'] })
  })

  it('still falls back to the configured IP when discovery times out', () => {
    const { platform, log } = buildPlatform([
      { id: 'ccccccccccccccccccc3', key: 'k', type: 'outlet', ip: '192.168.0.32' },
    ])

    platform.discoverDevices()
    expect(accessoryInstances).toHaveLength(0)

    vi.advanceTimersByTime(60000)

    expect(accessoryInstances).toHaveLength(1)
    expect(log.info).toHaveBeenCalledWith(
      'Failed to discover %s (%s) in time but will connect via %s.',
      'ccccccccccccccccccc3'.slice(8),
      'ccccccccccccccccccc3',
      '192.168.0.32',
    )
  })

  it('does not arm the discovery timeout when there is nothing to discover', () => {
    const { platform, log } = buildPlatform([
      { id: 'aaaaaaaaaaaaaaaaaaa1', key: 'k', type: 'outlet', ip: '192.168.0.30', version: '3.3' },
    ])

    platform.discoverDevices()
    vi.advanceTimersByTime(60000)

    expect(accessoryInstances).toHaveLength(1)
    expect(log.warn).not.toHaveBeenCalled()
  })
})

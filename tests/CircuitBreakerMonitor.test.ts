import { describe, it, expect, vi, beforeEach } from 'vitest'
import CircuitBreakerMonitorAccessory from '../src/accessories/CircuitBreakerMonitor.accessory'
import {
  createMockLogger,
  createMockTuyaDevice,
  createMockPlatformAccessory,
  createMockService,
  createMockCategories,
  createMockCharacteristic,
} from './helpers'

function createCircuitBreaker(contextOverrides = {}) {
  const device = createMockTuyaDevice({
    name: 'Circuit Breaker',
    type: 'circuitbreakermonitor',
    version: '3.3',
    ...contextOverrides,
  } as any)

  const accessory = createMockPlatformAccessory('Circuit Breaker', 'cbm-uuid')
  const log = createMockLogger()

  const Characteristic: any = {
    ...createMockCharacteristic(),
    LeakDetected: { LEAK_NOT_DETECTED: 0, LEAK_DETECTED: 1 },
    ContactSensorState: { CONTACT_DETECTED: 0, CONTACT_NOT_DETECTED: 1 },
  }

  const Service = createMockService()

  const platform = {
    log,
    api: {
      hap: {
        Characteristic,
        Service,
        Categories: createMockCategories(),
      },
    },
    registerPlatformAccessories: vi.fn(),
  }

  const acc = new CircuitBreakerMonitorAccessory(platform, accessory, device, false)

  acc.dpTemperature = '103'
  acc.dpLeakageCurrent = '15'
  acc.dpFault = '9'
  acc.dpTotalForwardEnergy = '1'
  acc.dpSwitch = '16'
  acc.dpPhaseA = '6'
  acc.temperatureDivisor = 1
  acc.energyDivisor = 100
  acc.leakageThreshold = 30
  acc.telemetry = {
    totalForwardEnergy: undefined,
    leakageCurrent: undefined,
    temperature: undefined,
    fault: undefined,
    switchState: undefined,
    phaseData: undefined,
  }

  return { acc, log, Characteristic }
}

describe('CircuitBreakerMonitorAccessory', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns SENSOR category', () => {
    const categories = createMockCategories()
    expect(CircuitBreakerMonitorAccessory.getCategory(categories)).toBe(categories.SENSOR)
  })

  it('parses temperature and energy values using configured divisors', () => {
    const { acc } = createCircuitBreaker()

    expect(acc._getTemperature({ '103': 25 })).toBe(25)
    expect(acc._getEnergy({ '1': 1234 })).toBe(12.34)
  })

  it('applies temperatureDivisor when device reports tenths of a degree', () => {
    const { acc } = createCircuitBreaker()
    acc.temperatureDivisor = 10

    expect(acc._getTemperature({ '103': 250 })).toBe(25)
    expect(acc._getTemperature({ '103': 245 })).toBe(24.5)
  })

  it('getTemperature returns error when DP value is not yet available', () => {
    const { acc } = createCircuitBreaker()
    acc.device.connected = true
    acc.device.state = {}

    let cbErr: Error | null = null
    acc.getTemperature((err: Error | null) => {
      cbErr = err
    })

    return new Promise<void>((resolve) => {
      process.nextTick(() => {
        expect(cbErr).toBeInstanceOf(Error)
        resolve()
      })
    })
  })

  it('warns and returns zero when temperature or energy DPS are missing', () => {
    const { acc, log } = createCircuitBreaker()

    expect(acc._getTemperature({})).toBe(0)
    expect(acc._getEnergy({})).toBe(0)
    expect(log.warn).toHaveBeenCalled()
  })

  it('detects leakage based on configured threshold', () => {
    const { acc, Characteristic, log } = createCircuitBreaker()

    expect(acc._getLeakDetected({ '15': 10 })).toBe(Characteristic.LeakDetected.LEAK_NOT_DETECTED)
    expect(acc._getLeakDetected({ '15': 30 })).toBe(Characteristic.LeakDetected.LEAK_DETECTED)
    expect(log.warn).toHaveBeenCalledWith(
      '[CircuitBreakerMonitor] ⚠️  LEAKAGE DETECTED: %d mA (threshold: %d mA)',
      30,
      30,
    )
  })

  it('maps fault bitmap to inverted ContactSensorState logic', () => {
    const { acc, Characteristic } = createCircuitBreaker()

    expect(acc._getFaultState({ '9': 0 })).toBe(Characteristic.ContactSensorState.CONTACT_DETECTED)
    expect(acc._getFaultState({ '9': 1 })).toBe(Characteristic.ContactSensorState.CONTACT_NOT_DETECTED)
  })

  it('updates internal telemetry snapshot from DPS payload', () => {
    const { acc } = createCircuitBreaker()

    acc._updateTelemetry({
      '1': 500,
      '103': 25,
      '15': 12,
      '9': 4,
      '16': true,
    })

    expect(acc.telemetry.totalForwardEnergy).toBe(5)
    expect(acc.telemetry.temperature).toBe(25)
    expect(acc.telemetry.leakageCurrent).toBe(12)
    expect(acc.telemetry.fault).toBe(4)
    expect(acc.telemetry.switchState).toBe(true)
  })

  it('handles phase payload decoding input validation paths', () => {
    const { acc, log } = createCircuitBreaker()

    acc._decodePhaseData(undefined as any)
    acc._decodePhaseData(123 as any)

    expect(log.warn).toHaveBeenCalled()
  })

  it('decodes base64 phase data and stores parsed phase data', () => {
    const { acc } = createCircuitBreaker()
    const parserSpy = vi.spyOn(acc, '_parsePhasePayload').mockReturnValue({ voltage: 230.1, current: 1.25, power: 288 })

    const payload = Buffer.from('01020304').toString('base64')
    acc._decodePhaseData(payload)

    expect(parserSpy).toHaveBeenCalled()
    expect(acc.telemetry.phaseData).toEqual({ voltage: 230.1, current: 1.25, power: 288 })
  })
})

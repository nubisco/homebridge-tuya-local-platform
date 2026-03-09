import { describe, it, expect, vi } from 'vitest'
import DehumidifierAccessory from '../src/accessories/Dehumidifier.accessory'
import {
  createMockLogger,
  createMockTuyaDevice,
  createMockPlatformAccessory,
  createMockCharacteristic,
  createMockService,
  createMockCategories,
} from './helpers'

function createDehumidifier(contextOverrides = {}) {
  const device = createMockTuyaDevice({
    name: 'Dehumidifier',
    type: 'dehumidifier',
    version: '3.3',
    manufacturer: 'Tuya',
    model: 'DH-001',
    ...contextOverrides,
  } as any)
  const accessory = createMockPlatformAccessory({ name: 'Dehumidifier' })
  const log = createMockLogger()
  const Characteristic = createMockCharacteristic()
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

  const acc = new DehumidifierAccessory(platform, accessory, device, false)

  return { acc, device, accessory, platform, log, Characteristic, Service }
}

describe('DehumidifierAccessory', () => {
  describe('getCategory', () => {
    it('should return AIR_DEHUMIDIFIER category', () => {
      const Categories = createMockCategories()
      expect(DehumidifierAccessory.getCategory(Categories)).toBe(23)
    })
  })

  describe('getDp', () => {
    it('should use default DP mappings', () => {
      const { acc } = createDehumidifier()
      expect(acc.getDp('Active')).toBe('1')
      expect(acc.getDp('Mode')).toBe('2')
      expect(acc.getDp('Humidity')).toBe('4')
      expect(acc.getDp('FanSpeed')).toBe('6')
      expect(acc.getDp('ChildLock')).toBe('7')
      expect(acc.getDp('TankState')).toBe('11')
      expect(acc.getDp('CurrentTemperature')).toBe('103')
      expect(acc.getDp('CurrentHumidity')).toBe('104')
    })

    it('should use custom DP from device context when available', () => {
      const { acc } = createDehumidifier({ dpsActive: 10, dpsHumidity: 20 })
      // getDp returns the raw context value (number) when custom DP is set
      expect(acc.getDp('Active')).toBe(10)
      expect(acc.getDp('Humidity')).toBe(20)
      // Non-overridden ones fall through to String(defaultDps[name])
      expect(acc.getDp('Mode')).toBe('2')
    })
  })

  describe('_getActive', () => {
    it('should return ACTIVE for truthy values', () => {
      const { acc, Characteristic } = createDehumidifier()
      expect(acc._getActive(true)).toBe(Characteristic.Active.ACTIVE)
      expect(acc._getActive(1)).toBe(Characteristic.Active.ACTIVE)
    })

    it('should return INACTIVE for falsy values', () => {
      const { acc, Characteristic } = createDehumidifier()
      expect(acc._getActive(false)).toBe(Characteristic.Active.INACTIVE)
      expect(acc._getActive(0)).toBe(Characteristic.Active.INACTIVE)
    })
  })

  describe('_getLockTargetState', () => {
    it('should return SECURED for truthy values', () => {
      const { acc, Characteristic } = createDehumidifier()
      expect(acc._getLockTargetState(true)).toBe(Characteristic.LockTargetState.SECURED)
    })

    it('should return UNSECURED for falsy values', () => {
      const { acc, Characteristic } = createDehumidifier()
      expect(acc._getLockTargetState(false)).toBe(Characteristic.LockTargetState.UNSECURED)
    })
  })

  describe('_getCurrentTemperature', () => {
    it('should pass through the value', () => {
      const { acc } = createDehumidifier()
      expect(acc._getCurrentTemperature(25)).toBe(25)
      expect(acc._getCurrentTemperature(0)).toBe(0)
    })
  })

  describe('_getCurrentHumidity', () => {
    it('should pass through the value', () => {
      const { acc } = createDehumidifier()
      expect(acc._getCurrentHumidity(65)).toBe(65)
      expect(acc._getCurrentHumidity(0)).toBe(0)
    })
  })

  describe('_getRotationSpeed', () => {
    it('should subtract 1 for speeds > 1', () => {
      const { acc } = createDehumidifier()
      expect(acc._getRotationSpeed(3)).toBe(2)
      expect(acc._getRotationSpeed(2)).toBe(1)
    })

    it('should return value as-is for speeds <= 1', () => {
      const { acc } = createDehumidifier()
      expect(acc._getRotationSpeed(1)).toBe(1)
      expect(acc._getRotationSpeed(0)).toBe(0)
    })
  })

  describe('_getTankState', () => {
    it('should return 100 for truthy tank state (full)', () => {
      const { acc } = createDehumidifier()
      expect(acc._getTankState(true)).toBe(100)
    })

    it('should return 50 for falsy tank state (not full)', () => {
      const { acc } = createDehumidifier()
      expect(acc._getTankState(false)).toBe(50)
    })
  })

  describe('_getTargetHumidity', () => {
    it('should return humidity when active', () => {
      const { acc } = createDehumidifier()
      expect(acc._getTargetHumidity({ '1': true, '4': 60 })).toBe(60)
    })

    it('should return 0 when inactive', () => {
      const { acc } = createDehumidifier()
      expect(acc._getTargetHumidity({ '1': false, '4': 60 })).toBe(0)
    })
  })

  describe('setTargetHumidity', () => {
    it('should clamp to default min 40', () => {
      const { acc, device } = createDehumidifier()
      device.connected = true
      device.state = { '1': false, '4': 0 }
      acc.characteristicHumidity = { updateValue: vi.fn() }
      acc.setTargetHumidity(10, vi.fn())

      expect(device.update).toHaveBeenCalledWith({ '1': true })
      expect(device.update).toHaveBeenCalledWith({ '4': 40 })
      expect(acc.characteristicHumidity.updateValue).toHaveBeenCalledWith(40)
    })

    it('should clamp to default max 80', () => {
      const { acc, device } = createDehumidifier()
      device.connected = true
      device.state = { '1': false, '4': 0 }
      acc.characteristicHumidity = { updateValue: vi.fn() }
      acc.setTargetHumidity(95, vi.fn())

      expect(device.update).toHaveBeenCalledWith({ '4': 80 })
      expect(acc.characteristicHumidity.updateValue).toHaveBeenCalledWith(80)
    })

    it('should accept value within bounds without clamping', () => {
      const { acc, device } = createDehumidifier()
      device.connected = true
      device.state = { '1': false, '4': 0 }
      acc.characteristicHumidity = { updateValue: vi.fn() }
      acc.setTargetHumidity(55, vi.fn())

      expect(device.update).toHaveBeenCalledWith({ '4': 55 })
      expect(acc.characteristicHumidity.updateValue).not.toHaveBeenCalled()
    })

    it('should use custom min/max from context', () => {
      const { acc, device } = createDehumidifier({ minHumidity: 30, maxHumidity: 70 })
      device.connected = true
      device.state = { '1': false, '4': 0 }
      acc.characteristicHumidity = { updateValue: vi.fn() }
      acc.setTargetHumidity(25, vi.fn())

      expect(device.update).toHaveBeenCalledWith({ '4': 30 })
    })

    it('should always activate the device', () => {
      const { acc, device } = createDehumidifier()
      device.connected = true
      device.state = { '1': false, '4': 0 }
      acc.characteristicHumidity = { updateValue: vi.fn() }
      acc.setTargetHumidity(50, vi.fn())

      expect(device.update).toHaveBeenCalledWith({ '1': true })
    })
  })

  describe('default properties', () => {
    it('should set mode command strings', () => {
      const { acc } = createDehumidifier()
      expect(acc.cmdDehumidify).toBe('0')
      expect(acc.cmdContinual).toBe('1')
      expect(acc.cmdAuto).toBe('2')
      expect(acc.cmdLaundry).toBe('3')
    })
  })
})

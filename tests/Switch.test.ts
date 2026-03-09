import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import SwitchAccessory from '../src/accessories/Switch.accessory'
import {
  createMockLogger,
  createMockTuyaDevice,
  createMockPlatformAccessory,
  createMockCharacteristic,
  createMockService,
  createMockCategories,
} from './helpers'

function createSwitch(contextOverrides = {}) {
  const device = createMockTuyaDevice({
    name: 'Test Switch',
    type: 'switch',
    version: '3.3',
    ...contextOverrides,
  } as any)

  const accessory = createMockPlatformAccessory(contextOverrides)
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

  const switchAcc = new SwitchAccessory(platform, accessory, device, false)

  return { switchAcc, device, accessory, platform, log, Characteristic, Service }
}

describe('SwitchAccessory', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getCategory', () => {
    it('returns SWITCH category', () => {
      const Categories = createMockCategories()
      expect(SwitchAccessory.getCategory(Categories)).toBe(8)
    })
  })

  describe('single switch', () => {
    it('creates single switch by default', () => {
      const { switchAcc, accessory, Service } = createSwitch()

      switchAcc._registerPlatformAccessory()

      const service = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      expect(service).toBeDefined()
      expect(service!.displayName).toContain('1')
    })

    it('registers characteristics for single switch', () => {
      const { switchAcc, accessory, Service, Characteristic } = createSwitch()

      switchAcc._registerPlatformAccessory()
      switchAcc._registerCharacteristics({ '1': true })

      const service = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      const char = service!.getCharacteristic(Characteristic.On)

      expect(char.value).toBe(true)
    })

    it('updates characteristic when device state changes', () => {
      const { switchAcc, device, accessory, Service, Characteristic } = createSwitch()

      switchAcc._registerPlatformAccessory()
      switchAcc._registerCharacteristics({ '1': false })

      const service = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      const char = service!.getCharacteristic(Characteristic.On)
      const updateSpy = vi.spyOn(char, 'updateValue')

      device.state = { '1': true }
      device.emit('change', { '1': true }, { '1': true })

      expect(updateSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('multiple switches', () => {
    it('creates multiple switches based on switchCount', () => {
      const { switchAcc, accessory, Service } = createSwitch({ switchCount: '3' })

      switchAcc._registerPlatformAccessory()

      const service1 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      const service2 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 2')
      const service3 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 3')

      expect(service1).toBeDefined()
      expect(service2).toBeDefined()
      expect(service3).toBeDefined()
    })

    it('registers characteristics for all switches', () => {
      const { switchAcc, accessory, Service, Characteristic } = createSwitch({ switchCount: '3' })

      switchAcc._registerPlatformAccessory()
      switchAcc._registerCharacteristics({ '1': true, '2': false, '3': true })

      const service1 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      const service2 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 2')
      const service3 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 3')

      expect(service1!.getCharacteristic(Characteristic.On).value).toBe(true)
      expect(service2!.getCharacteristic(Characteristic.On).value).toBe(false)
      expect(service3!.getCharacteristic(Characteristic.On).value).toBe(true)
    })

    it('updates only changed switch characteristics', () => {
      const { switchAcc, device, accessory, Service, Characteristic } = createSwitch({ switchCount: '3' })

      switchAcc._registerPlatformAccessory()
      switchAcc._registerCharacteristics({ '1': false, '2': false, '3': false })

      const service1 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      const service2 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 2')
      const service3 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 3')

      // Emit change for only switch 2
      device.state = { '1': false, '2': true, '3': false }
      device.emit('change', { '2': true }, { '1': false, '2': true, '3': false })

      // Only switch 2 should have updated value
      expect(service1!.getCharacteristic(Characteristic.On).value).toBe(false)
      expect(service2!.getCharacteristic(Characteristic.On).value).toBe(true)
      expect(service3!.getCharacteristic(Characteristic.On).value).toBe(false)
    })
  })

  describe('batched power changes', () => {
    it('batches multiple rapid set requests together', () => {
      const { switchAcc, device, accessory, Service, Characteristic } = createSwitch({ switchCount: '2' })

      // Device must be connected for setMultiState to work
      device.connected = true

      switchAcc._registerPlatformAccessory()
      switchAcc._registerCharacteristics({ '1': false, '2': false })

      const service1 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      const service2 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 2')

      const char1 = service1!.getCharacteristic(Characteristic.On)
      const char2 = service2!.getCharacteristic(Characteristic.On)

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      // Rapid set requests
      char1.emit('set', true, callback1)
      char2.emit('set', true, callback2)

      // Callbacks not called immediately
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()

      // After 500ms batch delay
      vi.advanceTimersByTime(500)

      expect(callback1).toHaveBeenCalledWith(null)
      expect(callback2).toHaveBeenCalledWith(null)
      // Device update is called for each switch that changed
      expect(device.update).toHaveBeenCalledWith({ '1': true })
      expect(device.update).toHaveBeenCalledWith({ '2': true })
    })

    it('resets timer when new request arrives during batching period', () => {
      const { switchAcc, device, accessory, Service, Characteristic } = createSwitch({ switchCount: '2' })

      // Device must be connected for setMultiState to work
      device.connected = true

      switchAcc._registerPlatformAccessory()
      switchAcc._registerCharacteristics({ '1': false, '2': false })

      const service1 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 1')
      const service2 = accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch 2')

      const char1 = service1!.getCharacteristic(Characteristic.On)
      const char2 = service2!.getCharacteristic(Characteristic.On)

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      // First set
      char1.emit('set', true, callback1)
      vi.advanceTimersByTime(300)

      // Second set resets timer
      char2.emit('set', true, callback2)
      vi.advanceTimersByTime(300)

      // Not called yet (reset)
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()

      // Another 200ms (500ms total from second set)
      vi.advanceTimersByTime(200)

      expect(callback1).toHaveBeenCalledWith(null)
      expect(callback2).toHaveBeenCalledWith(null)
    })
  })
})

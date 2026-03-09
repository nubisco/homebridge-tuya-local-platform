import { describe, it, expect, vi } from 'vitest'
import SimpleLightAccessory from '../src/accessories/SimpleLight.accessory'
import {
  createMockLogger,
  createMockTuyaDevice,
  createMockPlatformAccessory,
  createMockCharacteristic,
  createMockService,
  createMockCategories,
} from './helpers'

function createSimpleLight(contextOverrides = {}) {
  const device = createMockTuyaDevice({
    name: 'Test Light',
    type: 'simplelight',
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

  const light = new SimpleLightAccessory(platform, accessory, device, false)

  return { light, device, accessory, platform, log, Characteristic, Service }
}

describe('SimpleLightAccessory', () => {
  describe('getCategory', () => {
    it('returns LIGHTBULB category', () => {
      const Categories = createMockCategories()
      expect(SimpleLightAccessory.getCategory(Categories)).toBe(5)
    })
  })

  describe('registration', () => {
    it('adds Lightbulb service', () => {
      const { light, accessory, Service } = createSimpleLight()

      light._registerPlatformAccessory()

      const service = accessory.getService(Service.Lightbulb)
      expect(service).toBeDefined()
    })

    it('uses default DP 1 for power', () => {
      const { light } = createSimpleLight()

      light._registerPlatformAccessory()
      light._registerCharacteristics({ '1': true })

      expect(light.dpPower).toBe('1')
    })

    it('uses custom power DP when specified', () => {
      const { light } = createSimpleLight({ dpPower: '20' })

      light._registerPlatformAccessory()
      light._registerCharacteristics({ '20': false })

      expect(light.dpPower).toBe('20')
    })
  })

  describe('state management', () => {
    it('sets initial state from DPS', () => {
      const { light, accessory, Service, Characteristic } = createSimpleLight()

      light._registerPlatformAccessory()
      light._registerCharacteristics({ '1': true })

      const service = accessory.getService(Service.Lightbulb)
      const char = service!.getCharacteristic(Characteristic.On)

      expect(char.value).toBe(true)
    })

    it('updates characteristic when device state changes', () => {
      const { light, device, accessory, Service, Characteristic } = createSimpleLight()

      light._registerPlatformAccessory()
      light._registerCharacteristics({ '1': false })

      const service = accessory.getService(Service.Lightbulb)
      const char = service!.getCharacteristic(Characteristic.On)
      const updateSpy = vi.spyOn(char, 'updateValue')

      device.state = { '1': true }
      device.emit('change', { '1': true }, { '1': true })

      expect(updateSpy).toHaveBeenCalledWith(true)
    })

    it('logs state changes', () => {
      const { light, device, log } = createSimpleLight()

      light._registerPlatformAccessory()
      light._registerCharacteristics({ '1': false })

      device.state = { '1': true }
      device.emit('change', { '1': true }, { '1': true })

      expect(log.info).toHaveBeenCalledWith('SimpleLight changed: {"1":true}')
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import OutletAccessory from '../src/accessories/Outlet.accessory'
import {
  createMockLogger,
  createMockTuyaDevice,
  createMockPlatformAccessory,
  createMockCharacteristic,
  createMockService,
  createMockCategories,
  createMockEnergyCharacteristics,
} from './helpers'

function createOutlet(contextOverrides = {}) {
  const device = createMockTuyaDevice({
    name: 'Test Outlet',
    type: 'outlet',
    version: '3.3',
    ...contextOverrides,
  } as any)

  const accessory = createMockPlatformAccessory(contextOverrides)
  const log = createMockLogger()
  const Characteristic = createMockCharacteristic()
  const Service = createMockService()
  const EnergyCharacteristics = createMockEnergyCharacteristics()

  const platform = {
    log,
    api: {
      hap: {
        Characteristic,
        Service,
        Categories: createMockCategories(),
        EnergyCharacteristics,
      },
    },
    registerPlatformAccessories: vi.fn(),
  }

  const outlet = new OutletAccessory(platform, accessory, device, false)

  return { outlet, device, accessory, platform, log, Characteristic, Service, EnergyCharacteristics }
}

describe('OutletAccessory', () => {
  describe('getCategory', () => {
    it('returns OUTLET category', () => {
      const Categories = createMockCategories()
      expect(OutletAccessory.getCategory(Categories)).toBe(7)
    })
  })

  describe('registration', () => {
    it('adds Outlet service', () => {
      const { outlet, accessory, Service } = createOutlet()

      outlet._registerPlatformAccessory()

      const service = accessory.getService(Service.Outlet)
      expect(service).toBeDefined()
    })

    it('uses default DP 1 for power', () => {
      const { outlet } = createOutlet()

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': true })

      expect(outlet.dpPower).toBe('1')
    })

    it('uses custom power DP when specified', () => {
      const { outlet } = createOutlet({ dpPower: '5' })

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '5': false })

      expect(outlet.dpPower).toBe('5')
    })
  })

  describe('power control', () => {
    it('sets initial power state from DPS', () => {
      const { outlet, accessory, Service, Characteristic } = createOutlet()

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': true })

      const service = accessory.getService(Service.Outlet)
      const char = service!.getCharacteristic(Characteristic.On)

      expect(char.value).toBe(true)
    })

    it('updates characteristic when power state changes', () => {
      const { outlet, device, accessory, Service, Characteristic } = createOutlet()

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': false })

      const service = accessory.getService(Service.Outlet)
      const char = service!.getCharacteristic(Characteristic.On)
      const updateSpy = vi.spyOn(char, 'updateValue')

      device.state = { '1': true }
      device.emit('change', { '1': true })

      expect(updateSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('energy monitoring', () => {
    it('registers voltage characteristic when voltsId is provided', () => {
      const { outlet, accessory, Service, EnergyCharacteristics } = createOutlet({ voltsId: '20', voltsDivisor: '10' })

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': true, '20': 2200 })

      const service = accessory.getService(Service.Outlet)
      const voltsChar = service!.getCharacteristic(EnergyCharacteristics.Volts)

      expect(voltsChar.value).toBe(220) // 2200 / 10
    })

    it('registers amperage characteristic when ampsId is provided', () => {
      const { outlet, accessory, Service, EnergyCharacteristics } = createOutlet({ ampsId: '18', ampsDivisor: '1000' })

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': true, '18': 3500 })

      const service = accessory.getService(Service.Outlet)
      const ampsChar = service!.getCharacteristic(EnergyCharacteristics.Amperes)

      expect(ampsChar.value).toBe(3.5) // 3500 / 1000
    })

    it('registers watts characteristic when wattsId is provided', () => {
      const { outlet, accessory, Service, EnergyCharacteristics } = createOutlet({ wattsId: '19', wattsDivisor: '10' })

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': true, '19': 7700 })

      const service = accessory.getService(Service.Outlet)
      const wattsChar = service!.getCharacteristic(EnergyCharacteristics.Watts)

      expect(wattsChar.value).toBe(770) // 7700 / 10
    })

    it('updates voltage when device voltage changes', () => {
      const { outlet, device, accessory, Service, EnergyCharacteristics } = createOutlet({
        voltsId: '20',
        voltsDivisor: '10',
      })

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': true, '20': 2200 })

      const service = accessory.getService(Service.Outlet)
      const voltsChar = service!.getCharacteristic(EnergyCharacteristics.Volts)
      const updateSpy = vi.spyOn(voltsChar, 'updateValue')

      device.state = { '1': true, '20': 2300 }
      device.emit('change', { '20': 2300 })

      expect(updateSpy).toHaveBeenCalledWith(230)
    })

    it('uses default divisors when not specified', () => {
      const { outlet, accessory, Service, EnergyCharacteristics } = createOutlet({
        voltsId: '20',
        ampsId: '18',
        wattsId: '19',
      })

      outlet._registerPlatformAccessory()
      outlet._registerCharacteristics({ '1': true, '18': 5000, '19': 12000, '20': 2400 })

      const service = accessory.getService(Service.Outlet)

      expect(service!.getCharacteristic(EnergyCharacteristics.Volts).value).toBe(240) // default: 10
      expect(service!.getCharacteristic(EnergyCharacteristics.Amperes).value).toBe(5) // default: 1000
      expect(service!.getCharacteristic(EnergyCharacteristics.Watts).value).toBe(1200) // default: 10
    })
  })
})

import { describe, it, expect } from 'vitest'
import {
  AirConditionerAccessory,
  AirPurifierAccessory,
  CircuitBreakerMonitorAccessory,
  ConvectorAccessory,
  CustomMultiOutletAccessory,
  DehumidifierAccessory,
  GarageDoorAccessory,
  MappedHeatPumpHeaterAccessory,
  MultiOutletAccessory,
  OilDiffuserAccessory,
  OutletAccessory,
  RGBTWLightAccessory,
  RGBTWOutletAccessory,
  SimpleBlindsAccessory,
  SimpleDimmer2Accessory,
  SimpleDimmerAccessory,
  SimpleFanAccessory,
  SimpleFanLightAccessory,
  SimpleHeaterAccessory,
  SimpleLightAccessory,
  SwitchAccessory,
  TWLightAccessory,
  ValveAccessory,
} from '../src/accessories'

const Categories = {
  AIR_CONDITIONER: 1,
  AIR_PURIFIER: 2,
  AIR_DEHUMIDIFIER: 3,
  AIR_HEATER: 4,
  SENSOR: 5,
  OUTLET: 6,
  LIGHTBULB: 7,
  GARAGE_DOOR_OPENER: 8,
  WINDOW_COVERING: 9,
  FAN: 10,
  SWITCH: 11,
  FAUCET: 12,
}

describe('Accessory categories', () => {
  it('returns expected category for each accessory class', () => {
    expect(OutletAccessory.getCategory(Categories)).toBe(Categories.OUTLET)
    expect(SimpleLightAccessory.getCategory(Categories)).toBe(Categories.LIGHTBULB)
    expect(RGBTWLightAccessory.getCategory(Categories)).toBe(Categories.LIGHTBULB)
    expect(RGBTWOutletAccessory.getCategory(Categories)).toBe(Categories.OUTLET)
    expect(TWLightAccessory.getCategory(Categories)).toBe(Categories.LIGHTBULB)
    expect(MultiOutletAccessory.getCategory(Categories)).toBe(Categories.OUTLET)
    expect(CustomMultiOutletAccessory.getCategory(Categories)).toBe(Categories.OUTLET)
    expect(AirConditionerAccessory.getCategory(Categories)).toBe(Categories.AIR_CONDITIONER)
    expect(AirPurifierAccessory.getCategory(Categories)).toBe(Categories.AIR_PURIFIER)
    expect(DehumidifierAccessory.getCategory(Categories)).toBe(Categories.AIR_DEHUMIDIFIER)
    expect(ConvectorAccessory.getCategory(Categories)).toBe(Categories.AIR_HEATER)
    expect(GarageDoorAccessory.getCategory(Categories)).toBe(Categories.GARAGE_DOOR_OPENER)
    expect(SimpleDimmerAccessory.getCategory(Categories)).toBe(Categories.LIGHTBULB)
    expect(SimpleDimmer2Accessory.getCategory(Categories)).toBe(Categories.LIGHTBULB)
    expect(SimpleBlindsAccessory.getCategory(Categories)).toBe(Categories.WINDOW_COVERING)
    expect(SimpleHeaterAccessory.getCategory(Categories)).toBe(Categories.AIR_HEATER)
    expect(MappedHeatPumpHeaterAccessory.getCategory(Categories)).toBe(Categories.AIR_HEATER)
    expect(CircuitBreakerMonitorAccessory.getCategory(Categories)).toBe(Categories.SENSOR)
    expect(SwitchAccessory.getCategory(Categories)).toBe(Categories.SWITCH)
    expect(SimpleFanAccessory.getCategory(Categories)).toBe(Categories.FAN)
    expect(SimpleFanLightAccessory.getCategory(Categories)).toBe(Categories.FAN)
    expect(ValveAccessory.getCategory(Categories)).toBe(Categories.FAUCET)
    expect(OilDiffuserAccessory.getCategory(Categories)).toBe(Categories.AIR_DEHUMIDIFIER)
  })
})

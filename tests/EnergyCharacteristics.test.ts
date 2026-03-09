import { describe, it, expect } from 'vitest'
import EnergyCharacteristicsFactory from '../src/accessories/EnergyCharacteristics'

class MockCharacteristic {
  static Formats = { FLOAT: 'float' }
  static Perms = { PAIRED_READ: 'pr', NOTIFY: 'ev' }

  value: unknown
  props: Record<string, unknown> = {}
  displayName: string
  UUID: string

  constructor(displayName: string, uuid: string) {
    this.displayName = displayName
    this.UUID = uuid
    this.value = null
  }

  setProps(props: Record<string, unknown>) {
    this.props = { ...this.props, ...props }
    return this
  }

  getDefaultValue() {
    return 0
  }
}

describe('EnergyCharacteristicsFactory', () => {
  it('creates all expected custom energy characteristics', () => {
    const energy = EnergyCharacteristicsFactory(MockCharacteristic)

    expect(energy.Amperes).toBeDefined()
    expect(energy.KilowattHours).toBeDefined()
    expect(energy.KilowattVoltAmpereHour).toBeDefined()
    expect(energy.VoltAmperes).toBeDefined()
    expect(energy.Volts).toBeDefined()
    expect(energy.Watts).toBeDefined()
  })

  it('sets units and minimum step values correctly', () => {
    const energy = EnergyCharacteristicsFactory(MockCharacteristic)

    const amperes = new energy.Amperes()
    const kwh = new energy.KilowattHours()
    const kvah = new energy.KilowattVoltAmpereHour()
    const va = new energy.VoltAmperes()
    const volts = new energy.Volts()
    const watts = new energy.Watts()

    expect(amperes.displayName).toBe('Amperes')
    expect(amperes.props.unit).toBe('A')
    expect(amperes.props.minStep).toBe(0.001)

    expect(kwh.displayName).toBe('Kilowatt Hours')
    expect(kwh.props.unit).toBe('kWh')
    expect(kwh.props.minStep).toBe(0.001)

    expect(kvah.displayName).toBe('Kilowatt Volt Ampere Hour')
    expect(kvah.props.unit).toBe('kVAh')

    expect(va.displayName).toBe('Volt Amperes')
    expect(va.props.unit).toBe('VA')

    expect(volts.displayName).toBe('Volts')
    expect(volts.props.unit).toBe('V')
    expect(volts.props.minStep).toBe(0.1)

    expect(watts.displayName).toBe('Watts')
    expect(watts.props.unit).toBe('W')
    expect(watts.props.minStep).toBe(0.1)
  })
})

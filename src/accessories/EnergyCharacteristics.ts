import type { Characteristic as CharacteristicType, WithUUID } from 'homebridge'
import type { EnergyCharacteristicsMap } from '../types'

const createEnergyCharacteristics = (Characteristic: any): EnergyCharacteristicsMap => {
  class EnergyCharacteristic extends Characteristic {
    static readonly UUID: string = ''

    constructor(displayName: string, UUID: string) {
      super(displayName, UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
      })
      this.value = this.getDefaultValue()
    }
  }

  class Amperes extends EnergyCharacteristic {
    static readonly UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52'

    constructor() {
      super('Amperes', Amperes.UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'A' as any,
        perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
        minStep: 0.001,
      })
      this.value = this.getDefaultValue()
    }
  }

  class KilowattHours extends EnergyCharacteristic {
    static readonly UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52'

    constructor() {
      super('Kilowatt Hours', KilowattHours.UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kWh' as any,
        perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
        minStep: 0.001,
      })
      this.value = this.getDefaultValue()
    }
  }

  class KilowattVoltAmpereHour extends EnergyCharacteristic {
    static readonly UUID = 'E863F127-079E-48FF-8F27-9C2605A29F52'

    constructor() {
      super('Kilowatt Volt Ampere Hour', KilowattVoltAmpereHour.UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'kVAh' as any,
        perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
        minStep: 0.001,
      })
      this.value = this.getDefaultValue()
    }
  }

  class VoltAmperes extends EnergyCharacteristic {
    static readonly UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52'

    constructor() {
      super('Volt Amperes', VoltAmperes.UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'VA' as any,
        perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
        minStep: 0.001,
      })
      this.value = this.getDefaultValue()
    }
  }

  class Volts extends EnergyCharacteristic {
    static readonly UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52'

    constructor() {
      super('Volts', Volts.UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'V' as any,
        perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
        minStep: 0.1,
      })
      this.value = this.getDefaultValue()
    }
  }

  class Watts extends EnergyCharacteristic {
    static readonly UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52'

    constructor() {
      super('Watts', Watts.UUID)
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'W' as any,
        perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
        minStep: 0.1,
      })
      this.value = this.getDefaultValue()
    }
  }

  return {
    Amperes: Amperes as unknown as WithUUID<new () => CharacteristicType>,
    KilowattHours: KilowattHours as unknown as WithUUID<new () => CharacteristicType>,
    KilowattVoltAmpereHour: KilowattVoltAmpereHour as unknown as WithUUID<new () => CharacteristicType>,
    VoltAmperes: VoltAmperes as unknown as WithUUID<new () => CharacteristicType>,
    Volts: Volts as unknown as WithUUID<new () => CharacteristicType>,
    Watts: Watts as unknown as WithUUID<new () => CharacteristicType>,
  }
}

export default createEnergyCharacteristics

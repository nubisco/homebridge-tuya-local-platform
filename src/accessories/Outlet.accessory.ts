import BaseAccessory from './Base.accessory'
import type { DPSState } from '../types'

class OutletAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.OUTLET
  }

  dpPower!: string

  constructor(...props: any[]) {
    super(...props)
  }

  _registerPlatformAccessory(): void {
    const { Service } = this.hap

    this.accessory.addService(Service.Outlet, this.device.context.name)

    super._registerPlatformAccessory()
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic, EnergyCharacteristics } = this.hap
    const service = this.accessory.getService(Service.Outlet)
    this._checkServiceName(service, this.device.context.name)

    this.dpPower = this._getCustomDP(this.device.context.dpPower) || '1'

    const energyKeys = {
      volts: this._getCustomDP(this.device.context.voltsId),
      voltsDivisor: parseInt(this.device.context.voltsDivisor) || 10,
      amps: this._getCustomDP(this.device.context.ampsId),
      ampsDivisor: parseInt(this.device.context.ampsDivisor) || 1000,
      watts: this._getCustomDP(this.device.context.wattsId),
      wattsDivisor: parseInt(this.device.context.wattsDivisor) || 10,
    }

    let characteristicVolts: any
    if (energyKeys.volts) {
      characteristicVolts = service
        .getCharacteristic(EnergyCharacteristics.Volts)
        .updateValue(this._getDividedState(dps[energyKeys.volts as string], energyKeys.voltsDivisor))
        .on('get', this.getDividedState.bind(this, energyKeys.volts, energyKeys.voltsDivisor))
    } else this._removeCharacteristic(service, EnergyCharacteristics.Volts)

    let characteristicAmps: any
    if (energyKeys.amps) {
      characteristicAmps = service
        .getCharacteristic(EnergyCharacteristics.Amperes)
        .updateValue(this._getDividedState(dps[energyKeys.amps as string], energyKeys.ampsDivisor))
        .on('get', this.getDividedState.bind(this, energyKeys.amps, energyKeys.ampsDivisor))
    } else this._removeCharacteristic(service, EnergyCharacteristics.Amperes)

    let characteristicWatts: any
    if (energyKeys.watts) {
      characteristicWatts = service
        .getCharacteristic(EnergyCharacteristics.Watts)
        .updateValue(this._getDividedState(dps[energyKeys.watts as string], energyKeys.wattsDivisor))
        .on('get', this.getDividedState.bind(this, energyKeys.watts, energyKeys.wattsDivisor))
    } else this._removeCharacteristic(service, EnergyCharacteristics.Watts)

    const characteristicOn = service
      .getCharacteristic(Characteristic.On)
      .updateValue(dps[this.dpPower])
      .on('get', this.getState.bind(this, this.dpPower))
      .on('set', this.setState.bind(this, this.dpPower))

    this.device.on('change', (changes: DPSState) => {
      if (changes.hasOwnProperty(this.dpPower) && characteristicOn.value !== changes[this.dpPower])
        characteristicOn.updateValue(changes[this.dpPower])

      if (changes.hasOwnProperty(energyKeys.volts as string) && characteristicVolts) {
        const newVolts = this._getDividedState(changes[energyKeys.volts as string], energyKeys.voltsDivisor)
        if (characteristicVolts.value !== newVolts) characteristicVolts.updateValue(newVolts)
      }

      if (changes.hasOwnProperty(energyKeys.amps as string) && characteristicAmps) {
        const newAmps = this._getDividedState(changes[energyKeys.amps as string], energyKeys.ampsDivisor)
        if (characteristicAmps.value !== newAmps) characteristicAmps.updateValue(newAmps)
      }

      if (changes.hasOwnProperty(energyKeys.watts as string) && characteristicWatts) {
        const newWatts = this._getDividedState(changes[energyKeys.watts as string], energyKeys.wattsDivisor)
        if (characteristicWatts.value !== newWatts) characteristicWatts.updateValue(newWatts)
      }
    })
  }
}

export default OutletAccessory

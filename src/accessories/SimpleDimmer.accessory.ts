import BaseAccessory from './Base.accessory'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

class SimpleDimmerAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.LIGHTBULB
  }

  dpPower!: string
  dpBrightness!: string

  constructor(...props: any[]) {
    super(...props)
  }

  _registerPlatformAccessory(): void {
    const { Service } = this.hap
    this.accessory.addService(Service.Lightbulb, this.device.context.name)
    super._registerPlatformAccessory()
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic } = this.hap
    const service = this.accessory.getService(Service.Lightbulb)
    this._checkServiceName(service, this.device.context.name)

    this.dpPower = this._getCustomDP(this.device.context.dpPower) || '1'
    this.dpBrightness =
      this._getCustomDP(this.device.context.dpBrightness) || this._getCustomDP(this.device.context.dp) || '2'

    const characteristicOn = service
      .getCharacteristic(Characteristic.On)
      .updateValue(dps[this.dpPower])
      .on('get', this.getState.bind(this, this.dpPower))
      .on('set', this.setState.bind(this, this.dpPower))

    const characteristicBrightness = service
      .getCharacteristic(Characteristic.Brightness)
      .updateValue(this.convertBrightnessFromTuyaToHomeKit(dps[this.dpBrightness]))
      .on('get', this.getBrightness.bind(this))
      .on('set', this.setBrightness.bind(this))

    this.device.on('change', (changes: DPSState) => {
      if (changes.hasOwnProperty(this.dpPower) && characteristicOn.value !== changes[this.dpPower])
        characteristicOn.updateValue(changes[this.dpPower])
      if (
        changes.hasOwnProperty(this.dpBrightness) &&
        this.convertBrightnessFromHomeKitToTuya(characteristicBrightness.value as number) !== changes[this.dpBrightness]
      )
        characteristicBrightness.updateValue(this.convertBrightnessFromTuyaToHomeKit(changes[this.dpBrightness]))
    })
  }

  getBrightness(callback: HomebridgeCallback): void {
    callback(null, this.convertBrightnessFromTuyaToHomeKit(this.device.state[this.dpBrightness]))
  }

  setBrightness(value: DPSValue, callback: HomebridgeCallback): void {
    this.setState(this.dpBrightness, this.convertBrightnessFromHomeKitToTuya(value), callback)
  }
}

export default SimpleDimmerAccessory

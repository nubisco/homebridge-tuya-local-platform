import BaseAccessory from './Base.accessory'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

class TWLightAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.LIGHTBULB
  }

  dpPower!: string
  dpBrightness!: string
  dpColorTemperature!: string
  characteristicColorTemperature: any
  adaptiveLightingController: any

  constructor(...props: any[]) {
    super(...props)
  }

  _registerPlatformAccessory(): void {
    const { Service } = this.hap
    this.accessory.addService(Service.Lightbulb, this.device.context.name)
    super._registerPlatformAccessory()
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic, AdaptiveLightingController } = this.hap
    const service = this.accessory.getService(Service.Lightbulb)
    this._checkServiceName(service, this.device.context.name)

    this.dpPower = this._getCustomDP(this.device.context.dpPower) || '1'
    this.dpBrightness = this._getCustomDP(this.device.context.dpBrightness) || '2'
    this.dpColorTemperature = this._getCustomDP(this.device.context.dpColorTemperature) || '3'

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

    const characteristicColorTemperature = service
      .getCharacteristic(Characteristic.ColorTemperature)
      .setProps({
        minValue: 0,
        maxValue: 600,
      })
      .updateValue(this.convertColorTemperatureFromTuyaToHomeKit(dps[this.dpColorTemperature]))
      .on('get', this.getColorTemperature.bind(this))
      .on('set', this.setColorTemperature.bind(this))

    this.characteristicColorTemperature = characteristicColorTemperature

    if (this.adaptiveLightingSupport()) {
      this.adaptiveLightingController = new AdaptiveLightingController(service)
      this.accessory.configureController(this.adaptiveLightingController)
      ;(this.accessory as any).adaptiveLightingController = this.adaptiveLightingController
    }

    this.device.on('change', (changes: DPSState, state: DPSState) => {
      if (changes.hasOwnProperty(this.dpPower) && characteristicOn.value !== changes[this.dpPower])
        characteristicOn.updateValue(changes[this.dpPower])

      if (
        changes.hasOwnProperty(this.dpBrightness) &&
        this.convertBrightnessFromHomeKitToTuya(characteristicBrightness.value as number) !== changes[this.dpBrightness]
      )
        characteristicBrightness.updateValue(this.convertBrightnessFromTuyaToHomeKit(changes[this.dpBrightness]))

      if (changes.hasOwnProperty(this.dpColorTemperature)) {
        if (
          this.convertColorTemperatureFromHomeKitToTuya(characteristicColorTemperature.value as number) !==
          changes[this.dpColorTemperature]
        )
          characteristicColorTemperature.updateValue(
            this.convertColorTemperatureFromTuyaToHomeKit(changes[this.dpColorTemperature]),
          )
      } else if (changes[this.dpBrightness]) {
        characteristicColorTemperature.updateValue(
          this.convertColorTemperatureFromTuyaToHomeKit(state[this.dpColorTemperature]),
        )
      }
    })
  }

  getBrightness(callback: HomebridgeCallback): void {
    return callback(null, this.convertBrightnessFromTuyaToHomeKit(this.device.state[this.dpBrightness]))
  }

  setBrightness(value: DPSValue, callback: HomebridgeCallback): void {
    return this.setState(this.dpBrightness, this.convertBrightnessFromHomeKitToTuya(value), callback)
  }

  getColorTemperature(callback: HomebridgeCallback): void {
    callback(null, this.convertColorTemperatureFromTuyaToHomeKit(this.device.state[this.dpColorTemperature]))
  }

  setColorTemperature(value: DPSValue, callback: HomebridgeCallback): void {
    if (value === 0) return callback(null, true)
    this.setState(this.dpColorTemperature, this.convertColorTemperatureFromHomeKitToTuya(value), callback)
  }
}

export default TWLightAccessory

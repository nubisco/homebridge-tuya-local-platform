import BaseAccessory from './Base.accessory'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

class SimpleFanLightAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.FAN
  }

  dpFanOn!: string
  dpRotationSpeed!: string
  dpLightOn!: string
  dpBrightness!: string
  useLight!: boolean
  useBrightness!: boolean
  maxSpeed!: number
  fanDefaultSpeed!: number
  fanCurrentSpeed!: number
  useStrings!: boolean

  constructor(...props: any[]) {
    super(...props)
  }

  _registerPlatformAccessory(): void {
    const { Service } = this.hap
    this.accessory.addService(Service.Fan, this.device.context.name)
    this.accessory.addService(Service.Lightbulb, this.device.context.name + ' Light')
    super._registerPlatformAccessory()
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic } = this.hap
    const serviceFan = this.accessory.getService(Service.Fan)
    const serviceLightbulb = this.accessory.getService(Service.Lightbulb)
    this._checkServiceName(serviceFan, this.device.context.name)
    this._checkServiceName(serviceLightbulb, this.device.context.name + ' Light')
    this.dpFanOn = this._getCustomDP(this.device.context.dpFanOn) || '1'
    this.dpRotationSpeed = this._getCustomDP(this.device.context.dpRotationSpeed) || '3'
    this.dpLightOn = this._getCustomDP(this.device.context.dpLightOn) || '9'
    this.dpBrightness = this._getCustomDP(this.device.context.dpBrightness) || '10'
    this.useLight = this._coerceBoolean(this.device.context.useLight, true)
    this.useBrightness = this._coerceBoolean(this.device.context.useBrightness, false)
    this.maxSpeed = parseInt(this.device.context.maxSpeed) || 3
    this.fanDefaultSpeed = parseInt(this.device.context.fanDefaultSpeed) || 1
    this.fanCurrentSpeed = 0
    this.useStrings = this._coerceBoolean(this.device.context.useStrings, true)

    const characteristicFanOn = serviceFan
      .getCharacteristic(Characteristic.On)
      .updateValue(this._getFanOn(dps[this.dpFanOn]))
      .on('get', this.getFanOn.bind(this))
      .on('set', this.setFanOn.bind(this))

    const characteristicRotationSpeed = serviceFan
      .getCharacteristic(Characteristic.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: Math.max(100 / this.maxSpeed),
      })
      .updateValue(this.convertRotationSpeedFromTuyaToHomeKit(dps[this.dpRotationSpeed]))
      .on('get', this.getSpeed.bind(this))
      .on('set', this.setSpeed.bind(this))

    let characteristicLightOn: any
    let characteristicBrightness: any
    if (this.useLight) {
      characteristicLightOn = serviceLightbulb
        .getCharacteristic(Characteristic.On)
        .updateValue(this._getLightOn(dps[this.dpLightOn]))
        .on('get', this.getLightOn.bind(this))
        .on('set', this.setLightOn.bind(this))

      if (this.useBrightness) {
        characteristicBrightness = serviceLightbulb
          .getCharacteristic(Characteristic.Brightness)
          .setProps({
            minValue: 0,
            maxValue: 1000,
            minStep: 100,
          })
          .updateValue(this.convertBrightnessFromTuyaToHomeKit(dps[this.dpBrightness]))
          .on('get', this.getBrightness.bind(this))
          .on('set', this.setBrightness.bind(this))
      }
    }

    this.device.on('change', (changes: DPSState, state: DPSState) => {
      if (changes.hasOwnProperty(this.dpFanOn) && characteristicFanOn.value !== changes[this.dpFanOn])
        characteristicFanOn.updateValue(changes[this.dpFanOn])

      if (
        changes.hasOwnProperty(this.dpRotationSpeed) &&
        this.convertRotationSpeedFromHomeKitToTuya(characteristicRotationSpeed.value as number) !==
          changes[this.dpRotationSpeed]
      )
        characteristicRotationSpeed.updateValue(
          this.convertRotationSpeedFromTuyaToHomeKit(changes[this.dpRotationSpeed]),
        )

      if (
        changes.hasOwnProperty(this.dpLightOn) &&
        characteristicLightOn &&
        characteristicLightOn.value !== changes[this.dpLightOn]
      )
        characteristicLightOn.updateValue(changes[this.dpLightOn])

      if (
        changes.hasOwnProperty(this.dpBrightness) &&
        characteristicBrightness &&
        characteristicBrightness.value !== changes[this.dpBrightness]
      )
        characteristicBrightness.updateValue(changes[this.dpBrightness])

      this.log.debug('SimpleFanLight changed: ' + JSON.stringify(state))
    })
  }

  getFanOn(callback: HomebridgeCallback): void {
    this.getState(this.dpFanOn, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getFanOn(dp))
    })
  }

  _getFanOn(dp: DPSValue): DPSValue {
    return dp
  }

  setFanOn(value: DPSValue, callback: HomebridgeCallback): void {
    if (value == false) {
      this.fanCurrentSpeed = 0
      return this.setState(this.dpFanOn, false, callback)
    } else {
      if (this.fanCurrentSpeed === 0) {
        if (this.useStrings) {
          return this.setMultiStateLegacy(
            { [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanDefaultSpeed.toString() },
            callback,
          )
        } else {
          return this.setMultiStateLegacy(
            { [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanDefaultSpeed },
            callback,
          )
        }
      } else {
        if (this.useStrings) {
          return this.setMultiStateLegacy(
            { [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanCurrentSpeed.toString() },
            callback,
          )
        } else {
          return this.setMultiStateLegacy(
            { [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanCurrentSpeed },
            callback,
          )
        }
      }
    }
  }

  getSpeed(callback: HomebridgeCallback): void {
    this.getState(this.dpRotationSpeed, (err: Error | null, _dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this.convertRotationSpeedFromTuyaToHomeKit(this.device.state[this.dpRotationSpeed]))
    })
  }

  setSpeed(value: DPSValue, callback: HomebridgeCallback): void {
    if (value === 0) {
      if (this.useStrings) {
        return this.setMultiStateLegacy(
          { [this.dpFanOn]: false, [this.dpRotationSpeed]: this.fanDefaultSpeed.toString() },
          callback,
        )
      } else {
        return this.setMultiStateLegacy(
          { [this.dpFanOn]: false, [this.dpRotationSpeed]: this.fanDefaultSpeed },
          callback,
        )
      }
    } else {
      this.fanCurrentSpeed = this.convertRotationSpeedFromHomeKitToTuya(value) as number
      if (this.useStrings) {
        return this.setMultiStateLegacy(
          {
            [this.dpFanOn]: true,
            [this.dpRotationSpeed]: (this.convertRotationSpeedFromHomeKitToTuya(value) as number).toString(),
          },
          callback,
        )
      } else {
        return this.setMultiStateLegacy(
          { [this.dpFanOn]: true, [this.dpRotationSpeed]: this.convertRotationSpeedFromHomeKitToTuya(value) },
          callback,
        )
      }
    }
  }

  getLightOn(callback: HomebridgeCallback): void {
    this.getState(this.dpLightOn, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getLightOn(dp))
    })
  }

  _getLightOn(dp: DPSValue): DPSValue {
    return dp
  }

  setLightOn(value: DPSValue, callback: HomebridgeCallback): void {
    return this.setState(this.dpLightOn, value, callback)
  }

  getBrightness(callback: HomebridgeCallback): void {
    this.getState(this.dpBrightness, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getBrightness(dp))
    })
  }

  _getBrightness(dp: DPSValue): DPSValue {
    return dp
  }

  setBrightness(value: DPSValue, callback: HomebridgeCallback): void {
    return this.setState(this.dpBrightness, value, callback)
  }
}

export default SimpleFanLightAccessory

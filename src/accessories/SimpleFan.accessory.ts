import BaseAccessory from './Base.accessory'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

class SimpleFanAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.FAN
  }

  dpFanOn!: string
  dpRotationSpeed!: string
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
    super._registerPlatformAccessory()
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic } = this.hap
    const serviceFan = this.accessory.getService(Service.Fan)
    this._checkServiceName(serviceFan, this.device.context.name)
    this.dpFanOn = this._getCustomDP(this.device.context.dpFanOn) || '1'
    this.dpRotationSpeed = this._getCustomDP(this.device.context.dpRotationSpeed) || '3'
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

      this.log.debug('SimpleFan changed: ' + JSON.stringify(state))
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
}

export default SimpleFanAccessory

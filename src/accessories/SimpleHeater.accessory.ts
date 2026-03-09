import BaseAccessory from './Base.accessory'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

class SimpleHeaterAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.AIR_HEATER
  }

  dpActive!: string
  dpDesiredTemperature!: string
  dpCurrentTemperature!: string
  dpAmbientTemperature!: string | false
  temperatureDivisor!: number
  thresholdTemperatureDivisor!: number
  targetTemperatureDivisor!: number
  ambientTemperatureDivisor!: number
  characteristicHeatingThresholdTemperature!: any

  constructor(...props: any[]) {
    super(...props)
  }

  _registerPlatformAccessory(): void {
    const { Service } = this.hap

    this.accessory.addService(Service.HeaterCooler, this.device.context.name)

    if (this.device.context.dpAmbientTemperature) {
      const ambientName = this.device.context.ambientTemperatureName || this.device.context.name + ' Ambient'
      this.accessory.addService(Service.TemperatureSensor, ambientName)
      this.log.info(`[SimpleHeater] Adding ambient temperature sensor: ${ambientName}`)
    }

    super._registerPlatformAccessory()
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic } = this.hap
    const service = this.accessory.getService(Service.HeaterCooler)
    this._checkServiceName(service, this.device.context.name)

    this.dpActive = this._getCustomDP(this.device.context.dpActive) || '1'
    this.dpDesiredTemperature = this._getCustomDP(this.device.context.dpDesiredTemperature) || '2'
    this.dpCurrentTemperature = this._getCustomDP(this.device.context.dpCurrentTemperature) || '3'
    this.temperatureDivisor = parseInt(this.device.context.temperatureDivisor) || 1
    this.thresholdTemperatureDivisor = parseInt(this.device.context.thresholdTemperatureDivisor) || 1
    this.targetTemperatureDivisor = parseInt(this.device.context.targetTemperatureDivisor) || 1

    this.dpAmbientTemperature = this._getCustomDP(this.device.context.dpAmbientTemperature)
    this.ambientTemperatureDivisor = parseInt(this.device.context.ambientTemperatureDivisor) || 1

    this.log.debug(
      `[SimpleHeater] DP mapping - Active: ${this.dpActive}, CurrentTemp: ${this.dpCurrentTemperature}, DesiredTemp: ${this.dpDesiredTemperature}, AmbientTemp: ${this.dpAmbientTemperature || 'not configured'}`,
    )
    this.log.debug(
      `[SimpleHeater] Divisors - Temperature: ${this.temperatureDivisor}, Threshold: ${this.thresholdTemperatureDivisor}, Target: ${this.targetTemperatureDivisor}, Ambient: ${this.ambientTemperatureDivisor}`,
    )

    const characteristicActive = service
      .getCharacteristic(Characteristic.Active)
      .updateValue(this._getActive(dps[this.dpActive]))
      .on('get', this.getActive.bind(this))
      .on('set', this.setActive.bind(this))

    service
      .getCharacteristic(Characteristic.CurrentHeaterCoolerState)
      .updateValue(this._getCurrentHeaterCoolerState(dps))
      .on('get', this.getCurrentHeaterCoolerState.bind(this))

    service
      .getCharacteristic(Characteristic.TargetHeaterCoolerState)
      .setProps({
        minValue: 1,
        maxValue: 1,
        validValues: [Characteristic.TargetHeaterCoolerState.HEAT],
      })
      .updateValue(this._getTargetHeaterCoolerState())
      .on('get', this.getTargetHeaterCoolerState.bind(this))
      .on('set', this.setTargetHeaterCoolerState.bind(this))

    const characteristicCurrentTemperature = service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .updateValue(this._getDividedState(dps[this.dpCurrentTemperature], this.temperatureDivisor))
      .on('get', this.getDividedState.bind(this, this.dpCurrentTemperature, this.temperatureDivisor))

    this.log.debug(
      `[SimpleHeater] Initial current temperature from DP ${this.dpCurrentTemperature}: raw=${dps[this.dpCurrentTemperature]}, converted=${this._getDividedState(dps[this.dpCurrentTemperature], this.temperatureDivisor)}°C`,
    )

    let characteristicAmbientTemperature: any
    if (this.dpAmbientTemperature) {
      const ambientService = this.accessory.getService(Service.TemperatureSensor)
      if (ambientService) {
        characteristicAmbientTemperature = ambientService
          .getCharacteristic(Characteristic.CurrentTemperature)
          .updateValue(this._getDividedState(dps[this.dpAmbientTemperature], this.ambientTemperatureDivisor))
          .on('get', this.getDividedState.bind(this, this.dpAmbientTemperature, this.ambientTemperatureDivisor))

        this.log.debug(
          `[SimpleHeater] Initial ambient temperature from DP ${this.dpAmbientTemperature}: raw=${dps[this.dpAmbientTemperature]}, converted=${this._getDividedState(dps[this.dpAmbientTemperature], this.ambientTemperatureDivisor)}°C`,
        )
      }
    }

    const characteristicHeatingThresholdTemperature = service
      .getCharacteristic(Characteristic.HeatingThresholdTemperature)
      .setProps({
        minValue: this.device.context.minTemperature || 15,
        maxValue: this.device.context.maxTemperature || 35,
        minStep: this.device.context.minTemperatureSteps || 1,
      })
      .updateValue(this._getDividedState(dps[this.dpDesiredTemperature], this.thresholdTemperatureDivisor))
      .on('get', this.getDividedState.bind(this, this.dpDesiredTemperature, this.thresholdTemperatureDivisor))
      .on('set', this.setTargetThresholdTemperature.bind(this))

    this.characteristicHeatingThresholdTemperature = characteristicHeatingThresholdTemperature

    this.device.on('change', (changes: DPSState, state: DPSState) => {
      if (changes.hasOwnProperty(this.dpActive)) {
        const newActive = this._getActive(changes[this.dpActive])
        if (characteristicActive.value !== newActive) {
          characteristicActive.updateValue(newActive)
        }
      }

      if (changes.hasOwnProperty(this.dpDesiredTemperature)) {
        if (characteristicHeatingThresholdTemperature.value !== changes[this.dpDesiredTemperature])
          characteristicHeatingThresholdTemperature.updateValue(
            (changes[this.dpDesiredTemperature] as number) * this.targetTemperatureDivisor,
          )
      }

      if (
        changes.hasOwnProperty(this.dpCurrentTemperature) &&
        characteristicCurrentTemperature.value !== changes[this.dpCurrentTemperature]
      )
        characteristicCurrentTemperature.updateValue(
          this._getDividedState(changes[this.dpCurrentTemperature], this.temperatureDivisor),
        )

      if (
        this.dpAmbientTemperature &&
        changes.hasOwnProperty(this.dpAmbientTemperature) &&
        characteristicAmbientTemperature
      ) {
        const convertedAmbient = this._getDividedState(
          changes[this.dpAmbientTemperature],
          this.ambientTemperatureDivisor,
        )
        if (characteristicAmbientTemperature.value !== convertedAmbient) {
          this.log.debug(
            `[SimpleHeater] Ambient temperature changed - DP ${this.dpAmbientTemperature}: raw=${changes[this.dpAmbientTemperature]}, converted=${convertedAmbient}°C`,
          )
          characteristicAmbientTemperature.updateValue(convertedAmbient)
        }
      }

      this.log.info('SimpleHeater changed: ' + JSON.stringify(state))
    })
  }

  getActive(callback: HomebridgeCallback): void {
    this.getState(this.dpActive, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getActive(dp))
    })
  }

  _getActive(dp: DPSValue): number {
    const { Characteristic } = this.hap
    return dp ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE
  }

  setActive(value: DPSValue, callback: HomebridgeCallback): void {
    const { Characteristic } = this.hap

    switch (value) {
      case Characteristic.Active.ACTIVE:
        return this.setState(this.dpActive, true, callback)
      case Characteristic.Active.INACTIVE:
        return this.setState(this.dpActive, false, callback)
    }

    callback()
  }

  getCurrentHeaterCoolerState(callback: HomebridgeCallback): void {
    this.getState([this.dpActive], (err: Error | null, dps: DPSState) => {
      if (err) return callback(err)
      callback(null, this._getCurrentHeaterCoolerState(dps))
    })
  }

  _getCurrentHeaterCoolerState(dps: DPSState): number {
    const { Characteristic } = this.hap
    return dps[this.dpActive]
      ? Characteristic.CurrentHeaterCoolerState.HEATING
      : Characteristic.CurrentHeaterCoolerState.INACTIVE
  }

  getTargetHeaterCoolerState(callback: HomebridgeCallback): void {
    callback(null, this._getTargetHeaterCoolerState())
  }

  _getTargetHeaterCoolerState(): number {
    const { Characteristic } = this.hap
    return Characteristic.TargetHeaterCoolerState.HEAT
  }

  setTargetHeaterCoolerState(value: DPSValue, callback: HomebridgeCallback): void {
    this.setState(this.dpActive, true, callback)
  }

  setTargetThresholdTemperature(value: DPSValue, callback: HomebridgeCallback): void {
    this.setState(
      this.dpDesiredTemperature,
      (value as number) * this.thresholdTemperatureDivisor,
      (err: Error | null) => {
        if (err) return callback(err)

        if (this.characteristicHeatingThresholdTemperature) {
          this.characteristicHeatingThresholdTemperature.updateValue(value)
        }

        callback()
      },
    )
  }
}

export default SimpleHeaterAccessory

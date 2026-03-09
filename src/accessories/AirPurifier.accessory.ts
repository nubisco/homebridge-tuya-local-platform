import BaseAccessory from './Base.accessory'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

const DP_SWITCH = '1'
const DP_PM25 = '2'
const DP_MODE = '3'
const DP_FAN_SPEED = '4'
const DP_LOCK_PHYSICAL_CONTROLS = '7'
const DP_AIR_QUALITY = '22'
const STATE_OTHER = 9

class AirPurifierAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.AIR_PURIFIER
  }

  _rotationSteps!: number[]
  _rotationStops!: Record<number, string | number>
  _hkRotationSpeed?: number
  airQualityLevels!: [number, number][]
  cmdAuto!: string

  constructor(...props: any[]) {
    super(...props)
    const { Characteristic } = this.hap

    if (this.device.context.noRotationSpeed) {
      let fanSpeedSteps =
        this.device.context.fanSpeedSteps &&
        isFinite(this.device.context.fanSpeedSteps) &&
        this.device.context.fanSpeedSteps > 0 &&
        this.device.context.fanSpeedSteps < 100
          ? this.device.context.fanSpeedSteps
          : 100
      let _fanSpeedLabels: Record<number, string | number> = {}

      switch (this.device.context.manufacturer) {
        case 'Breville':
          _fanSpeedLabels = { 0: 'off', 1: 'low', 2: 'mid', 3: 'high', 4: 'turbo' }
          this._rotationSteps = [...Array(5).keys()]
          fanSpeedSteps = 5
          break
        case 'Proscenic':
          _fanSpeedLabels = { 0: 'sleep', 1: 'mid', 2: 'high', 3: 'auto' }
          fanSpeedSteps = 3
          this._rotationSteps = [...Array(4).keys()]
          break
        case 'siguro':
          _fanSpeedLabels = { 0: 'sleep', 1: 'auto' }
          fanSpeedSteps = 2
          this._rotationSteps = [...Array(2).keys()]
          break
        default:
          this._rotationSteps = [...Array(fanSpeedSteps).keys()]
          for (let i = 0; i <= fanSpeedSteps; i++) {
            _fanSpeedLabels[i] = i
          }
      }

      this._rotationStops = { 0: _fanSpeedLabels[0] }
      for (let i = 0; i < 100; i++) {
        const _rotationStep = Math.floor((fanSpeedSteps * i) / 100)
        this._rotationStops[i + 1] = _fanSpeedLabels[_rotationStep]
      }
    }

    this.airQualityLevels = [
      [200, Characteristic.AirQuality.POOR],
      [150, Characteristic.AirQuality.INFERIOR],
      [100, Characteristic.AirQuality.FAIR],
      [50, Characteristic.AirQuality.GOOD],
      [0, Characteristic.AirQuality.EXCELLENT],
    ]

    this.cmdAuto = 'AUTO'
    if (this.device.context.cmdAuto) {
      if (/^a[a-z]+$/i.test(this.device.context.cmdAuto)) this.cmdAuto = ('' + this.device.context.cmdAuto).trim()
      else throw new Error("The cmdAuto doesn't appear to be valid: " + this.device.context.cmdAuto)
    }
  }

  _registerPlatformAccessory(): void {
    const { Service } = this.hap
    this.accessory.addService(Service.AirPurifier, this.device.context.name)
    if (this.device.context.showAirQuality) {
      this._addAirQualityService()
    }
    super._registerPlatformAccessory()
  }

  _addAirQualityService(): void {
    const { Service } = this.hap
    const nameAirQuality = this.device.context.nameAirQuality || 'Air Quality'
    this.log.info('Adding air quality sensor: %s', nameAirQuality)
    this.accessory.addService(Service.AirQualitySensor, nameAirQuality)
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic } = this.hap

    const airPurifierService = this.accessory.getService(Service.AirPurifier)
    this._checkServiceName(airPurifierService, this.device.context.name)

    this.log.debug('_registerCharacteristics dps: %o', dps)

    const characteristicActive = airPurifierService
      .getCharacteristic(Characteristic.Active)
      .updateValue(this._getActive(dps[DP_SWITCH]))
      .on('get', this.getActive.bind(this))
      .on('set', this.setActive.bind(this))

    const characteristicCurrentAirPurifierState = airPurifierService
      .getCharacteristic(Characteristic.CurrentAirPurifierState)
      .updateValue(this._getCurrentAirPurifierState(dps[DP_SWITCH]))
      .on('get', this.getCurrentAirPurifierState.bind(this))

    const characteristicTargetAirPurifierState = airPurifierService
      .getCharacteristic(Characteristic.TargetAirPurifierState)
      .updateValue(this._getTargetAirPurifierState(this._getMode(dps)))
      .on('get', this.getTargetAirPurifierState.bind(this))
      .on('set', this.setTargetAirPurifierState.bind(this))

    let characteristicLockPhysicalControls: any
    if (!this.device.context.noChildLock) {
      characteristicLockPhysicalControls = airPurifierService
        .getCharacteristic(Characteristic.LockPhysicalControls)
        .updateValue(this._getLockPhysicalControls(dps[DP_LOCK_PHYSICAL_CONTROLS]))
        .on('get', this.getLockPhysicalControls.bind(this))
        .on('set', this.setLockPhysicalControls.bind(this))
    } else {
      // Note: original code had a bug using `service` instead of `airPurifierService`
      this._removeCharacteristic(airPurifierService, Characteristic.LockPhysicalControls)
    }

    const characteristicRotationSpeed = airPurifierService
      .getCharacteristic(Characteristic.RotationSpeed)
      .updateValue(this._getRotationSpeed(dps))
      .on('get', this.getRotationSpeed.bind(this))
      .on('set', this.setRotationSpeed.bind(this))

    let airQualitySensorService = this.accessory.getService(Service.AirQualitySensor)
    let characteristicAirQuality: any
    let characteristicPM25Density: any

    if (!airQualitySensorService && this.device.context.showAirQuality) {
      this._addAirQualityService()
      airQualitySensorService = this.accessory.getService(Service.AirQualitySensor)
    } else if (airQualitySensorService && !this.device.context.showAirQuality) {
      this.accessory.removeService(airQualitySensorService)
    }

    if (airQualitySensorService) {
      const nameAirQuality = this.device.context.nameAirQuality || 'Air Quality'
      this._checkServiceName(airQualitySensorService, nameAirQuality)

      characteristicAirQuality = airQualitySensorService
        .getCharacteristic(Characteristic.AirQuality)
        .updateValue(this._getAirQuality(dps))
        .on('get', this.getAirQuality.bind(this))

      characteristicPM25Density = airQualitySensorService
        .getCharacteristic(Characteristic.PM2_5Density)
        .updateValue(dps[DP_PM25])
        .on('get', this.getPM25.bind(this))
    }

    this.device.on('change', (changes: DPSState, state: DPSState) => {
      this.log.debug('Changes: %o, State: %o', changes, state)

      if (changes.hasOwnProperty(DP_SWITCH)) {
        const newActive = this._getActive(changes[DP_SWITCH])

        if (changes[DP_SWITCH]) {
          this.log.debug('Switching state first')
          characteristicActive.updateValue(newActive)
          characteristicCurrentAirPurifierState.updateValue(this._getCurrentAirPurifierState(changes[DP_SWITCH]))
        }

        if (!changes.hasOwnProperty(DP_FAN_SPEED)) {
          characteristicRotationSpeed.updateValue(this._getRotationSpeed(state))
        }
        if (!changes.hasOwnProperty(DP_MODE)) {
          characteristicTargetAirPurifierState.updateValue(this._getTargetAirPurifierState(this._getMode(state)))
        }

        if (!changes[DP_SWITCH]) {
          this.log.debug('Switching state last')
          characteristicCurrentAirPurifierState.updateValue(this._getCurrentAirPurifierState(changes[DP_SWITCH]))
          characteristicActive.updateValue(newActive)
        }
      }

      if (changes.hasOwnProperty(DP_FAN_SPEED)) {
        const newRotationSpeed = this._getRotationSpeed(state)
        if (newRotationSpeed) {
          if (characteristicRotationSpeed.value !== newRotationSpeed) {
            characteristicRotationSpeed.updateValue(newRotationSpeed)
          }
        }

        if (!changes.hasOwnProperty(DP_MODE)) {
          characteristicTargetAirPurifierState.updateValue(this._getTargetAirPurifierState(this._getMode(state)))
        }
      }

      if (characteristicLockPhysicalControls && changes.hasOwnProperty(DP_LOCK_PHYSICAL_CONTROLS)) {
        const newLockPhysicalControls = this._getLockPhysicalControls(changes[DP_LOCK_PHYSICAL_CONTROLS])
        if (characteristicLockPhysicalControls.value !== newLockPhysicalControls) {
          characteristicLockPhysicalControls.updateValue(newLockPhysicalControls)
        }
      }

      if (changes.hasOwnProperty(DP_MODE)) {
        const newTargetAirPurifierState = this._getTargetAirPurifierState(changes[DP_MODE])
        if (characteristicTargetAirPurifierState.value !== newTargetAirPurifierState) {
          characteristicTargetAirPurifierState.updateValue(newTargetAirPurifierState)
        }
      }

      if (airQualitySensorService && changes.hasOwnProperty(DP_PM25)) {
        const newPM25 = changes[DP_PM25]
        if (characteristicPM25Density.value !== newPM25) {
          characteristicPM25Density.updateValue(newPM25)
        }
        if (!changes.hasOwnProperty(DP_AIR_QUALITY)) {
          characteristicAirQuality.updateValue(this._getAirQuality(state))
        }
      }
    })
  }

  _getMode(state: DPSState): string {
    if (state[DP_MODE]) {
      return state[DP_MODE] as string
    } else {
      return state[DP_FAN_SPEED] == 'auto' ? 'auto' : 'manual'
    }
  }

  getActive(callback: HomebridgeCallback): void {
    this.getState(DP_SWITCH, (err: Error | null, dp: DPSValue) => {
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
        return this.setState(DP_SWITCH, true, callback)
      case Characteristic.Active.INACTIVE:
        return this.setState(DP_SWITCH, false, callback)
    }
    callback()
  }

  getAirQuality(callback: HomebridgeCallback): void {
    this.getState([DP_PM25], (err: Error | null, dps: DPSState) => {
      if (err) return callback(err)
      callback(null, this._getAirQuality(dps))
    })
  }

  _getAirQuality(dps: DPSState): number {
    const { Characteristic } = this.hap
    switch (this.device.context.manufacturer) {
      case 'Breville':
        if (dps[DP_AIR_QUALITY]) {
          switch (dps[DP_AIR_QUALITY]) {
            case 'poor':
              return Characteristic.AirQuality.POOR
            case 'good':
              return Characteristic.AirQuality.GOOD
            case 'great':
              return Characteristic.AirQuality.EXCELLENT
            default:
              this.log.warn('Unhandled _getAirQuality value: %s', dps[DP_AIR_QUALITY])
              return Characteristic.AirQuality.UNKNOWN
          }
        }
        break
      default:
        if (dps[DP_PM25]) {
          for (const item of this.airQualityLevels) {
            if ((dps[DP_PM25] as number) >= item[0]) {
              return item[1]
            }
          }
        }
    }
    return 0
  }

  getCurrentAirPurifierState(callback: HomebridgeCallback): void {
    this.getState(DP_SWITCH, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getCurrentAirPurifierState(dp))
    })
  }

  _getCurrentAirPurifierState(dp: DPSValue): number {
    const { Characteristic } = this.hap
    return dp ? Characteristic.CurrentAirPurifierState.PURIFYING_AIR : Characteristic.CurrentAirPurifierState.INACTIVE
  }

  getLockPhysicalControls(callback: HomebridgeCallback): void {
    this.getState(DP_LOCK_PHYSICAL_CONTROLS, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getLockPhysicalControls(dp))
    })
  }

  _getLockPhysicalControls(dp: DPSValue): number {
    const { Characteristic } = this.hap
    return dp
      ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
      : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED
  }

  setLockPhysicalControls(value: DPSValue, callback: HomebridgeCallback): void {
    const { Characteristic } = this.hap
    switch (value) {
      case Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED:
        return this.setState(DP_LOCK_PHYSICAL_CONTROLS, true, callback)
      case Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED:
        return this.setState(DP_LOCK_PHYSICAL_CONTROLS, false, callback)
    }
    callback()
  }

  getPM25(callback: HomebridgeCallback): void {
    this.getState(DP_PM25, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, dp)
    })
  }

  getRotationSpeed(callback: HomebridgeCallback): void {
    this.getState([DP_SWITCH, DP_FAN_SPEED], (err: Error | null, dps: DPSState) => {
      if (err) return callback(err)
      callback(null, this._getRotationSpeed(dps))
    })
  }

  _getRotationSpeed(dps: DPSState): number | string {
    if (!dps[DP_SWITCH]) {
      return 0
    } else if (this._hkRotationSpeed) {
      const currntRotationSpeed = this.convertRotationSpeedFromHomeKitToTuya(this._hkRotationSpeed)
      return currntRotationSpeed === dps[DP_FAN_SPEED]
        ? this._hkRotationSpeed
        : (this._hkRotationSpeed = this.convertRotationSpeedFromTuyaToHomeKit(dps[DP_FAN_SPEED]))
    }
    return (this._hkRotationSpeed = this.convertRotationSpeedFromTuyaToHomeKit(dps[DP_FAN_SPEED]))
  }

  setRotationSpeed(value: number, callback: HomebridgeCallback): void {
    const { Characteristic } = this.hap
    if (value === 0) {
      this.setActive(Characteristic.Active.INACTIVE, callback)
    } else {
      this._hkRotationSpeed = value
      return this.setState(DP_FAN_SPEED, this.convertRotationSpeedFromHomeKitToTuya(value), callback)
    }
  }

  getTargetAirPurifierState(callback: HomebridgeCallback): void {
    this.getState([DP_MODE, DP_FAN_SPEED], (err: Error | null, dps: DPSState) => {
      if (err) return callback(err)
      callback(null, this._getTargetAirPurifierState(this._getMode(dps)))
    })
  }

  _getTargetAirPurifierState(dp: DPSValue): number {
    const { Characteristic } = this.hap
    switch (dp) {
      case 'manual':
      case 'Manual':
        return Characteristic.TargetAirPurifierState.MANUAL
      case 'Sleep':
      case 'auto':
      case 'Auto':
        return Characteristic.TargetAirPurifierState.AUTO
      default:
        this.log.warn('Unhandled getTargetAirPurifierState value: %s', dp)
        return STATE_OTHER
    }
  }

  setTargetAirPurifierState(value: DPSValue, callback: HomebridgeCallback): void {
    const { Characteristic } = this.hap
    switch (value) {
      case Characteristic.TargetAirPurifierState.MANUAL:
        if (this.device.context.manufacturer == 'Breville') {
          return this.setState(DP_MODE, 'manual', callback)
        } else if (this.device.context.manufacturer == 'Proscenic') {
          return this.setState(DP_FAN_SPEED, 'sleep', callback)
        } else if (this.device.context.manufacturer == 'siguro') {
          return this.setState(DP_FAN_SPEED, 'sleep', callback)
        } else {
          return this.setState(DP_MODE, 'Manual', callback)
        }

      case Characteristic.TargetAirPurifierState.AUTO:
        if (this.device.context.manufacturer == 'Breville') {
          return this.setState(DP_MODE, 'auto', callback)
        } else if (this.device.context.manufacturer == 'Proscenic') {
          return this.setState(DP_FAN_SPEED, 'auto', callback)
        } else if (this.device.context.manufacturer == 'siguro') {
          return this.setState(DP_FAN_SPEED, 'auto', callback)
        } else {
          return this.setState(DP_MODE, 'Auto', callback)
        }

      default:
        this.log.warn('Unhandled setTargetAirPurifierState value: %s', value)
    }
    callback()
  }

  getKeyByValue(object: Record<string, any>, value: any): string | undefined {
    return Object.keys(object).find((key) => object[key] === value)
  }

  convertRotationSpeedFromHomeKitToTuya(value: number): string | number {
    this.log.debug('convertRotationSpeedFromHomeKitToTuya: %s: %s', value, this._rotationStops[parseInt(String(value))])
    return this._rotationStops[parseInt(String(value))]
  }

  convertRotationSpeedFromTuyaToHomeKit(value: DPSValue): number {
    this.log.debug(
      'convertRotationSpeedFromTuyaToHomeKit: %s: %s',
      value,
      this.getKeyByValue(this._rotationStops as Record<string, any>, value),
    )
    const speed: string | undefined = this.device.context.fanSpeedSteps
      ? '' + this.getKeyByValue(this._rotationStops as Record<string, any>, value)
      : this.getKeyByValue(this._rotationStops as Record<string, any>, value)
    if (speed === undefined) {
      return 0
    }
    return parseInt(String(speed)) || 0
  }
}

export default AirPurifierAccessory

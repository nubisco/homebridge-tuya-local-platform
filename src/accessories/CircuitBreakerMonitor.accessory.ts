import BaseAccessory from './Base.accessory'
import type { DPSState, DPSValue, HomebridgeCallback, CircuitBreakerTelemetry, PhaseData } from '../types'

/**
 * Circuit Breaker Monitor Accessory
 *
 * SAFETY-CRITICAL DEVICE - READ-ONLY MONITORING ONLY
 *
 * This accessory exposes telemetry from a Tuya-based digital circuit breaker/energy meter.
 * The breaker switch (DP 16) is NEVER exposed to HomeKit.
 *
 * HomeKit Services Exposed:
 * 1. TemperatureSensor - Device temperature monitoring
 * 2. LeakSensor - Leakage current warning (configurable threshold)
 * 3. ContactSensor - Fault alarm indicator
 */
class CircuitBreakerMonitorAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.SENSOR
  }

  temperatureSensor: any
  leakSensor: any
  faultSensor: any
  characteristicEnergy: any
  dpTemperature!: string
  dpLeakageCurrent!: string
  dpFault!: string
  dpTotalForwardEnergy!: string
  dpPhaseA!: string
  dpSwitch!: string
  temperatureDivisor!: number
  energyDivisor!: number
  leakageThreshold!: number
  telemetry!: CircuitBreakerTelemetry

  constructor(...props: any[]) {
    super(...props)
  }

  _registerPlatformAccessory(): void {
    const { Service } = this.hap

    this.accessory.category = (this.constructor as any).getCategory(this.hap.Categories)

    // Primary service: Device Temperature Sensor
    this.temperatureSensor = this.accessory.getService(Service.TemperatureSensor)
    if (!this.temperatureSensor && this.device.context.exposeTemperatureSensor !== false) {
      this.temperatureSensor = this.accessory.addService(Service.TemperatureSensor, this.device.context.name)
    }

    // Leakage Current Warning
    this.leakSensor = this.accessory.getService(Service.LeakSensor)
    if (!this.leakSensor && this.device.context.exposeLeakSensor !== false) {
      this.leakSensor = this.accessory.addService(
        Service.LeakSensor,
        this.device.context.leakSensorName || this.device.context.name + ' Leakage',
      )
    }

    // Fault Alarm Sensor
    this.faultSensor = this.accessory.getService(Service.ContactSensor)
    if (!this.faultSensor && this.device.context.exposeFaultSensor !== false) {
      this.faultSensor = this.accessory.addService(
        Service.ContactSensor,
        this.device.context.faultSensorName || this.device.context.name + ' Fault',
      )
    }

    super._registerPlatformAccessory()
  }

  _registerCharacteristics(dps: DPSState): void {
    const { Service, Characteristic, EnergyCharacteristics } = this.hap

    // For cached accessories _registerPlatformAccessory() is skipped (isNew=false),
    // so service references must be resolved here if not already set.
    if (!this.temperatureSensor) {
      this.temperatureSensor = this.accessory.getService(Service.TemperatureSensor)
    }
    if (!this.leakSensor) {
      this.leakSensor = this.accessory.getService(Service.LeakSensor)
    }
    if (!this.faultSensor) {
      this.faultSensor = this.accessory.getService(Service.ContactSensor)
    }

    // DP configuration with defaults
    this.dpTemperature = this._getCustomDP(this.device.context.dpTemperature) || '103'
    this.dpLeakageCurrent = this._getCustomDP(this.device.context.dpLeakageCurrent) || '15'
    this.dpFault = this._getCustomDP(this.device.context.dpFault) || '9'
    this.dpTotalForwardEnergy = this._getCustomDP(this.device.context.dpTotalForwardEnergy) || '1'
    this.dpPhaseA = this._getCustomDP(this.device.context.dpPhaseA) || '6'
    this.dpSwitch = this._getCustomDP(this.device.context.dpSwitch) || '16'

    // Divisors
    this.temperatureDivisor = this.device.context.temperatureDivisor || 1
    this.energyDivisor = this.device.context.energyDivisor || 100

    // Leakage threshold (mA)
    this.leakageThreshold = this.device.context.leakageThreshold || 30

    // Internal telemetry storage
    this.telemetry = {
      totalForwardEnergy: undefined,
      leakageCurrent: undefined,
      temperature: undefined,
      fault: undefined,
      switchState: undefined,
      phaseData: undefined,
    }

    // Register Temperature Sensor
    if (this.temperatureSensor) {
      this._checkServiceName(this.temperatureSensor, this.device.context.name)

      const tempChar = this.temperatureSensor
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
          minValue: -100,
          maxValue: 150,
        })
        .on('get', this.getTemperature.bind(this))

      // Only set initial value if the DP is already present in state.
      // If absent (device hasn't pushed it yet), leave the characteristic
      // empty so HomeKit shows "—" rather than a bogus 0°C.
      if (dps[this.dpTemperature] !== undefined && dps[this.dpTemperature] !== null) {
        tempChar.updateValue(this._getTemperature(dps))
      }

      // Add total energy consumption characteristic
      if (this.device.context.exposeEnergyCharacteristic !== false) {
        const energyValue = this._getEnergy(dps)
        this.characteristicEnergy = this.temperatureSensor
          .getCharacteristic(EnergyCharacteristics.KilowattHours)
          .updateValue(energyValue)
          .on('get', this.getEnergy.bind(this))
      }
    }

    // Register Leak Sensor
    if (this.leakSensor) {
      this._checkServiceName(
        this.leakSensor,
        this.device.context.leakSensorName || this.device.context.name + ' Leakage',
      )

      this.leakSensor
        .getCharacteristic(Characteristic.LeakDetected)
        .updateValue(this._getLeakDetected(dps))
        .on('get', this.getLeakDetected.bind(this))
    }

    // Register Fault Sensor
    if (this.faultSensor) {
      this._checkServiceName(
        this.faultSensor,
        this.device.context.faultSensorName || this.device.context.name + ' Fault',
      )

      this.faultSensor
        .getCharacteristic(Characteristic.ContactSensorState)
        .updateValue(this._getFaultState(dps))
        .on('get', this.getFaultState.bind(this))
    }

    // Listen for device updates
    this.device.on('change', (changes: DPSState, state: DPSState) => {
      this._processDeviceChanges(changes, state)
    })

    // Initial telemetry update
    this._updateTelemetry(dps)
    this._logTelemetry()
  }

  // Temperature Sensor

  getTemperature(callback: HomebridgeCallback): void {
    this.getState(this.dpTemperature, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      if (dp === undefined || dp === null) return callback(new Error('Temperature not yet available'))
      callback(null, this._getTemperature({ [this.dpTemperature]: dp }))
    })
  }

  _getTemperature(dps: DPSState): number {
    const rawValue = dps[this.dpTemperature]

    if (rawValue === undefined || rawValue === null) {
      this.log.warn('[CircuitBreakerMonitor] Temperature DP %s is undefined', this.dpTemperature)
      return 0
    }

    const temperature = parseFloat(String(rawValue)) / this.temperatureDivisor
    this.telemetry.temperature = temperature

    return temperature
  }

  // Energy Consumption

  getEnergy(callback: HomebridgeCallback): void {
    this.getState(this.dpTotalForwardEnergy, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getEnergy({ [this.dpTotalForwardEnergy]: dp }))
    })
  }

  _getEnergy(dps: DPSState): number {
    const rawValue = dps[this.dpTotalForwardEnergy]

    if (rawValue === undefined || rawValue === null) {
      this.log.warn('[CircuitBreakerMonitor] Energy DP %s is undefined', this.dpTotalForwardEnergy)
      return 0
    }

    const energy = parseInt(String(rawValue)) / this.energyDivisor
    this.telemetry.totalForwardEnergy = energy

    return energy
  }

  // Leak Detection (Leakage Current)

  getLeakDetected(callback: HomebridgeCallback): void {
    this.getState(this.dpLeakageCurrent, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getLeakDetected({ [this.dpLeakageCurrent]: dp }))
    })
  }

  _getLeakDetected(dps: DPSState): number {
    const { Characteristic } = this.hap
    const rawValue = dps[this.dpLeakageCurrent]

    if (rawValue === undefined || rawValue === null) {
      this.log.warn('[CircuitBreakerMonitor] Leakage current DP %s is undefined', this.dpLeakageCurrent)
      return Characteristic.LeakDetected.LEAK_NOT_DETECTED
    }

    const leakageCurrent = parseFloat(String(rawValue))
    this.telemetry.leakageCurrent = leakageCurrent

    const isLeaking = leakageCurrent >= this.leakageThreshold

    if (isLeaking) {
      this.log.warn(
        '[CircuitBreakerMonitor] ⚠️  LEAKAGE DETECTED: %d mA (threshold: %d mA)',
        leakageCurrent,
        this.leakageThreshold,
      )
    }

    return isLeaking ? Characteristic.LeakDetected.LEAK_DETECTED : Characteristic.LeakDetected.LEAK_NOT_DETECTED
  }

  // Fault Detection

  getFaultState(callback: HomebridgeCallback): void {
    this.getState(this.dpFault, (err: Error | null, dp: DPSValue) => {
      if (err) return callback(err)
      callback(null, this._getFaultState({ [this.dpFault]: dp }))
    })
  }

  _getFaultState(dps: DPSState): number {
    const { Characteristic } = this.hap
    const rawValue = dps[this.dpFault]

    if (rawValue === undefined || rawValue === null) {
      this.log.warn('[CircuitBreakerMonitor] Fault DP %s is undefined', this.dpFault)
      return Characteristic.ContactSensorState.CONTACT_DETECTED
    }

    const faultBitmap = parseInt(String(rawValue))
    this.telemetry.fault = faultBitmap

    const hasFault = faultBitmap !== 0

    if (hasFault) {
      this.log.warn('[CircuitBreakerMonitor] ⚠️  FAULT DETECTED: bitmap = 0x%s', faultBitmap.toString(16))
    }

    // Inverted logic: CONTACT_DETECTED = normal/no fault, CONTACT_NOT_DETECTED = fault/open circuit
    return hasFault
      ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
      : Characteristic.ContactSensorState.CONTACT_DETECTED
  }

  // Telemetry Updates (Internal Only)

  _processDeviceChanges(changes: DPSState, state: DPSState): void {
    const { Characteristic } = this.hap

    this._updateTelemetry(state)

    if (changes.hasOwnProperty(this.dpTemperature) && this.temperatureSensor) {
      this.temperatureSensor
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(this._getTemperature(state))
    }

    if (changes.hasOwnProperty(this.dpTotalForwardEnergy) && this.characteristicEnergy) {
      this.characteristicEnergy.updateValue(this._getEnergy(state))
    }

    if (changes.hasOwnProperty(this.dpLeakageCurrent) && this.leakSensor) {
      this.leakSensor.getCharacteristic(Characteristic.LeakDetected).updateValue(this._getLeakDetected(state))
    }

    if (changes.hasOwnProperty(this.dpFault) && this.faultSensor) {
      this.faultSensor.getCharacteristic(Characteristic.ContactSensorState).updateValue(this._getFaultState(state))
    }

    // Log switch state changes but NEVER expose to HomeKit
    if (changes.hasOwnProperty(this.dpSwitch)) {
      const switchState = state[this.dpSwitch]
      this.log('[CircuitBreakerMonitor] Breaker switch state: %s (READ-ONLY, NOT EXPOSED)', switchState ? 'ON' : 'OFF')
    }

    if (changes.hasOwnProperty(this.dpPhaseA)) {
      this._decodePhaseData(state[this.dpPhaseA])
    }

    if (Object.keys(changes).length > 0) {
      this._logTelemetry()
    }
  }

  _updateTelemetry(dps: DPSState): void {
    if (dps[this.dpTotalForwardEnergy] !== undefined) {
      const rawEnergy = parseInt(String(dps[this.dpTotalForwardEnergy]))
      this.telemetry.totalForwardEnergy = rawEnergy / this.energyDivisor
    }

    if (dps[this.dpTemperature] !== undefined) {
      this.telemetry.temperature = parseFloat(String(dps[this.dpTemperature])) / this.temperatureDivisor
    }

    if (dps[this.dpLeakageCurrent] !== undefined) {
      this.telemetry.leakageCurrent = parseFloat(String(dps[this.dpLeakageCurrent]))
    }

    if (dps[this.dpFault] !== undefined) {
      this.telemetry.fault = parseInt(String(dps[this.dpFault]))
    }

    if (dps[this.dpSwitch] !== undefined) {
      this.telemetry.switchState = Boolean(dps[this.dpSwitch])
    }
  }

  _logTelemetry(): void {
    const t = this.telemetry

    this.log(
      '[CircuitBreakerMonitor] Telemetry: ' + 'Energy=%s kWh, Temp=%s°C, Leakage=%s mA, Fault=0x%s, Switch=%s',
      t.totalForwardEnergy !== undefined ? t.totalForwardEnergy.toFixed(2) : 'N/A',
      t.temperature !== undefined ? t.temperature.toFixed(1) : 'N/A',
      t.leakageCurrent !== undefined ? t.leakageCurrent.toFixed(0) : 'N/A',
      t.fault !== undefined ? t.fault.toString(16) : 'N/A',
      t.switchState !== undefined ? (t.switchState ? 'ON' : 'OFF') : 'N/A',
    )
  }

  // Phase Data Decoder (DP 6)

  _decodePhaseData(rawPayload: DPSValue): void {
    try {
      if (!rawPayload) {
        this.log.warn('[CircuitBreakerMonitor] Phase data (DP %s) is undefined', this.dpPhaseA)
        return
      }

      let buffer: Buffer
      if (typeof rawPayload === 'string') {
        buffer = Buffer.from(rawPayload, 'base64')
      } else if (Buffer.isBuffer(rawPayload)) {
        buffer = rawPayload
      } else {
        this.log.warn('[CircuitBreakerMonitor] Unexpected phase data type: %s', typeof rawPayload)
        return
      }

      this.log.debug('[CircuitBreakerMonitor] Phase data (DP %s) raw buffer: %s', this.dpPhaseA, buffer.toString('hex'))

      const phaseData = this._parsePhasePayload(buffer)
      this.telemetry.phaseData = phaseData

      if (phaseData.voltage !== undefined || phaseData.current !== undefined || phaseData.power !== undefined) {
        this.log(
          '[CircuitBreakerMonitor] Phase: V=%s V, I=%s A, P=%s W',
          phaseData.voltage !== undefined ? phaseData.voltage.toFixed(1) : 'N/A',
          phaseData.current !== undefined ? phaseData.current.toFixed(2) : 'N/A',
          phaseData.power !== undefined ? phaseData.power.toFixed(0) : 'N/A',
        )
      }
    } catch (err: any) {
      this.log.warn('[CircuitBreakerMonitor] Failed to decode phase data: %s', err.message)
    }
  }

  _parsePhasePayload(_buffer: Buffer): PhaseData {
    // Stub implementation - return structure
    // TODO: Implement actual parsing when format is determined
    return {
      voltage: undefined,
      current: undefined,
      power: undefined,
    }
  }
}

export default CircuitBreakerMonitorAccessory

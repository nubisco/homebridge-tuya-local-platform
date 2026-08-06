import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback, CircuitBreakerTelemetry, PhaseData } from '../types';
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
declare class CircuitBreakerMonitorAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    temperatureSensor: any;
    leakSensor: any;
    faultSensor: any;
    characteristicEnergy: any;
    dpTemperature: string;
    dpLeakageCurrent: string;
    dpFault: string;
    dpTotalForwardEnergy: string;
    dpPhaseA: string;
    dpSwitch: string;
    temperatureDivisor: number;
    energyDivisor: number;
    leakageThreshold: number;
    telemetry: CircuitBreakerTelemetry;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getTemperature(callback: HomebridgeCallback): void;
    _getTemperature(dps: DPSState): number;
    getEnergy(callback: HomebridgeCallback): void;
    _getEnergy(dps: DPSState): number;
    getLeakDetected(callback: HomebridgeCallback): void;
    _getLeakDetected(dps: DPSState): number;
    getFaultState(callback: HomebridgeCallback): void;
    _getFaultState(dps: DPSState): number;
    _processDeviceChanges(changes: DPSState, state: DPSState): void;
    _updateTelemetry(dps: DPSState): void;
    _logTelemetry(): void;
    _decodePhaseData(rawPayload: DPSValue): void;
    _parsePhasePayload(_buffer: Buffer): PhaseData;
}
export default CircuitBreakerMonitorAccessory;
//# sourceMappingURL=CircuitBreakerMonitor.accessory.d.ts.map
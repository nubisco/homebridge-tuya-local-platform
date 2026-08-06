import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class AirPurifierAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    _rotationSteps: number[];
    _rotationStops: Record<number, string | number>;
    _hkRotationSpeed?: number;
    airQualityLevels: [number, number][];
    cmdAuto: string;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _addAirQualityService(): void;
    _registerCharacteristics(dps: DPSState): void;
    _getMode(state: DPSState): string;
    getActive(callback: HomebridgeCallback): void;
    _getActive(dp: DPSValue): number;
    setActive(value: DPSValue, callback: HomebridgeCallback): void;
    getAirQuality(callback: HomebridgeCallback): void;
    _getAirQuality(dps: DPSState): number;
    getCurrentAirPurifierState(callback: HomebridgeCallback): void;
    _getCurrentAirPurifierState(dp: DPSValue): number;
    getLockPhysicalControls(callback: HomebridgeCallback): void;
    _getLockPhysicalControls(dp: DPSValue): number;
    setLockPhysicalControls(value: DPSValue, callback: HomebridgeCallback): void;
    getPM25(callback: HomebridgeCallback): void;
    getRotationSpeed(callback: HomebridgeCallback): void;
    _getRotationSpeed(dps: DPSState): number | string;
    setRotationSpeed(value: number, callback: HomebridgeCallback): void;
    getTargetAirPurifierState(callback: HomebridgeCallback): void;
    _getTargetAirPurifierState(dp: DPSValue): number;
    setTargetAirPurifierState(value: DPSValue, callback: HomebridgeCallback): void;
    getKeyByValue(object: Record<string, any>, value: any): string | undefined;
    convertRotationSpeedFromHomeKitToTuya(value: number): string | number;
    convertRotationSpeedFromTuyaToHomeKit(value: DPSValue): number;
}
export default AirPurifierAccessory;
//# sourceMappingURL=AirPurifier.accessory.d.ts.map
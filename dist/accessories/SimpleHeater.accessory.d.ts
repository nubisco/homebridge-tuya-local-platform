import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class SimpleHeaterAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpActive: string;
    dpDesiredTemperature: string;
    dpCurrentTemperature: string;
    dpAmbientTemperature: string | false;
    temperatureDivisor: number;
    thresholdTemperatureDivisor: number;
    targetTemperatureDivisor: number;
    ambientTemperatureDivisor: number;
    characteristicHeatingThresholdTemperature: any;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getActive(callback: HomebridgeCallback): void;
    _getActive(dp: DPSValue): number;
    setActive(value: DPSValue, callback: HomebridgeCallback): void;
    getCurrentHeaterCoolerState(callback: HomebridgeCallback): void;
    _getCurrentHeaterCoolerState(dps: DPSState): number;
    getTargetHeaterCoolerState(callback: HomebridgeCallback): void;
    _getTargetHeaterCoolerState(): number;
    setTargetHeaterCoolerState(value: DPSValue, callback: HomebridgeCallback): void;
    setTargetThresholdTemperature(value: DPSValue, callback: HomebridgeCallback): void;
}
export default SimpleHeaterAccessory;
//# sourceMappingURL=SimpleHeater.accessory.d.ts.map
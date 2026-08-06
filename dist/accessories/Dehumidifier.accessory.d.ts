import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
interface DefaultDpsMap {
    [name: string]: number;
}
declare class DehumidifierAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    cmdDehumidify: string;
    cmdContinual: string;
    cmdAuto: string;
    cmdLaundry: string;
    defaultDps: DefaultDpsMap;
    characteristicHumidity: any;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getActive(callback: HomebridgeCallback): void;
    _getActive(dp: DPSValue): number;
    setActive(value: DPSValue, callback: HomebridgeCallback): void;
    getTankState(callback: HomebridgeCallback): void;
    _getTankState(dp: DPSValue): number;
    getLockTargetState(callback: HomebridgeCallback): void;
    _getLockTargetState(dp: DPSValue): number;
    setLockTargetState(value: DPSValue, callback: HomebridgeCallback): void;
    getRotationSpeed(callback: HomebridgeCallback): void;
    _getRotationSpeed(dp: DPSValue): number;
    setRotationSpeed(value: number, callback: HomebridgeCallback): void;
    getCurrentHumidity(callback: HomebridgeCallback): void;
    _getCurrentHumidity(dp: DPSValue): DPSValue;
    getCurrentTemperature(callback: HomebridgeCallback): void;
    _getCurrentTemperature(dp: DPSValue): DPSValue;
    getTargetHumidity(callback: HomebridgeCallback): void;
    _getTargetHumidity(dps: DPSState): number;
    setTargetHumidity(value: number, callback: HomebridgeCallback): void;
    getDp(name: string): string;
}
export default DehumidifierAccessory;
//# sourceMappingURL=Dehumidifier.accessory.d.ts.map
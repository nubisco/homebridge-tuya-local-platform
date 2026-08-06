import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class SimpleFanLightAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpFanOn: string;
    dpRotationSpeed: string;
    dpLightOn: string;
    dpBrightness: string;
    useLight: boolean;
    useBrightness: boolean;
    maxSpeed: number;
    fanDefaultSpeed: number;
    fanCurrentSpeed: number;
    useStrings: boolean;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getFanOn(callback: HomebridgeCallback): void;
    _getFanOn(dp: DPSValue): DPSValue;
    setFanOn(value: DPSValue, callback: HomebridgeCallback): void;
    getSpeed(callback: HomebridgeCallback): void;
    setSpeed(value: DPSValue, callback: HomebridgeCallback): void;
    getLightOn(callback: HomebridgeCallback): void;
    _getLightOn(dp: DPSValue): DPSValue;
    setLightOn(value: DPSValue, callback: HomebridgeCallback): void;
    getBrightness(callback: HomebridgeCallback): void;
    _getBrightness(dp: DPSValue): DPSValue;
    setBrightness(value: DPSValue, callback: HomebridgeCallback): void;
}
export default SimpleFanLightAccessory;
//# sourceMappingURL=SimpleFanLight.accessory.d.ts.map
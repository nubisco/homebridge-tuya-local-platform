import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class SimpleFanAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpFanOn: string;
    dpRotationSpeed: string;
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
}
export default SimpleFanAccessory;
//# sourceMappingURL=SimpleFan.accessory.d.ts.map
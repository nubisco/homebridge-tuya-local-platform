import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class SimpleDimmerAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpPower: string;
    dpBrightness: string;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getBrightness(callback: HomebridgeCallback): void;
    setBrightness(value: DPSValue, callback: HomebridgeCallback): void;
}
export default SimpleDimmerAccessory;
//# sourceMappingURL=SimpleDimmer.accessory.d.ts.map
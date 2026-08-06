import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class SimpleDimmer2Accessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpPower: string;
    dpBrightness: string;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getBrightness(callback: HomebridgeCallback): void;
    setBrightness(value: DPSValue, callback: HomebridgeCallback): void;
}
export default SimpleDimmer2Accessory;
//# sourceMappingURL=SimpleDimmer2.accessory.d.ts.map
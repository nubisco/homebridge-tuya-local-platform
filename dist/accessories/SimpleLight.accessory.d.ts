import BaseAccessory from './Base.accessory';
import type { DPSState } from '../types';
declare class SimpleLightAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpPower: string;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
}
export default SimpleLightAccessory;
//# sourceMappingURL=SimpleLight.accessory.d.ts.map
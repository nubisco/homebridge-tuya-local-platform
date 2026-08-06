import BaseAccessory from './Base.accessory';
import type { DPSState } from '../types';
declare class ValveAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpPower: string;
    setDuration: number;
    noTimer: any;
    lastActivationTime: number | null;
    timer: ReturnType<typeof setTimeout> | null;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
}
export default ValveAccessory;
//# sourceMappingURL=Valve.accessory.d.ts.map
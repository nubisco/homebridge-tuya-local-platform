import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class SwitchAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    private _justRegistered?;
    private _pendingPower;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _verifyCachedPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getPower(dp: string, callback: HomebridgeCallback): void;
    setPower(dp?: string, value?: DPSValue, callback?: HomebridgeCallback): void;
}
export default SwitchAccessory;
//# sourceMappingURL=Switch.accessory.d.ts.map
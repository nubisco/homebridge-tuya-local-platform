import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class SimpleBlindsAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpBlindType: number;
    dpAction: string;
    OPEN_COMMAND: string;
    CLOSE_COMMAND: string;
    STOP_COMMAND: string;
    cmdStop: string;
    cmdOpen: string;
    cmdClose: string;
    duration: number;
    minPosition: number;
    assumedPosition: number;
    assumedState: string;
    changeTime: number | false;
    targetPosition: number | false;
    changeTimeout?: ReturnType<typeof setTimeout>;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getCurrentPosition(callback: HomebridgeCallback): void;
    _getCurrentPosition(dp: DPSValue): number;
    getTargetPosition(callback: HomebridgeCallback): void;
    _getTargetPosition(dp: DPSValue): number;
    setTargetPosition(value: DPSValue, callback: HomebridgeCallback): void;
    getPositionState(callback: HomebridgeCallback): void;
    _getPositionState(): number;
}
export default SimpleBlindsAccessory;
//# sourceMappingURL=SimpleBlinds.accessory.d.ts.map
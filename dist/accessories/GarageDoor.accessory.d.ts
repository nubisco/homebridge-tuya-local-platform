import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class GarageDoorAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    manufacturer: string;
    dpAction: string;
    dpStatus: string;
    currentOpen: number;
    currentOpening: number;
    currentClosing: number;
    currentClosed: number;
    currentStopped: number;
    targetOpen: number;
    targetClosed: number;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _logPrefix(): string;
    _alwaysLog(...args: any[]): void;
    _debugLog(...args: any[]): void;
    _isKogan(): boolean;
    _isWofea(): boolean;
    _registerCharacteristics(dps: DPSState): void;
    getTargetDoorState(callback: HomebridgeCallback): void;
    _getTargetDoorState(dp: DPSValue): number | undefined;
    setTargetDoorState(value: DPSValue, callback: HomebridgeCallback): void;
    getCurrentDoorState(callback: HomebridgeCallback): void;
    _getCurrentDoorState(dpStatusValue: DPSValue): number | undefined;
}
export default GarageDoorAccessory;
//# sourceMappingURL=GarageDoor.accessory.d.ts.map
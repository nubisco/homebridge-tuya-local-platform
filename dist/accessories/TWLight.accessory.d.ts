import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback } from '../types';
declare class TWLightAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpPower: string;
    dpBrightness: string;
    dpColorTemperature: string;
    characteristicColorTemperature: any;
    adaptiveLightingController: any;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getBrightness(callback: HomebridgeCallback): void;
    setBrightness(value: DPSValue, callback: HomebridgeCallback): void;
    getColorTemperature(callback: HomebridgeCallback): void;
    setColorTemperature(value: DPSValue, callback: HomebridgeCallback): void;
}
export default TWLightAccessory;
//# sourceMappingURL=TWLight.accessory.d.ts.map
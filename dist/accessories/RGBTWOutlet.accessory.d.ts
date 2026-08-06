import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback, HSBColor } from '../types';
interface PendingHueSaturation {
    props: Partial<HSBColor>;
    callbacks: HomebridgeCallback[];
    timer?: ReturnType<typeof setTimeout>;
}
declare class RGBTWOutletAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    dpLight: string;
    dpMode: string;
    dpBrightness: string;
    dpColorTemperature: string;
    dpColor: string;
    dpPower: string;
    cmdWhite: string;
    cmdColor: string;
    characteristicHue: any;
    characteristicSaturation: any;
    characteristicColorTemperature: any;
    _justRegistered?: boolean;
    _pendingHueSaturation: PendingHueSaturation | null;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _verifyCachedPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getBrightness(callback: HomebridgeCallback): void;
    setBrightness(value: DPSValue, callback: HomebridgeCallback): void;
    getColorTemperature(callback: HomebridgeCallback): void;
    setColorTemperature(value: DPSValue, callback: HomebridgeCallback): void;
    getHue(callback: HomebridgeCallback): void;
    setHue(value: DPSValue, callback: HomebridgeCallback): void;
    getSaturation(callback: HomebridgeCallback): void;
    setSaturation(value: DPSValue, callback: HomebridgeCallback): void;
    _setHueSaturation(prop?: Partial<HSBColor>, callback?: HomebridgeCallback): void;
}
export default RGBTWOutletAccessory;
//# sourceMappingURL=RGBTWOutlet.accessory.d.ts.map
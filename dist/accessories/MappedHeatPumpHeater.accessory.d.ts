import BaseAccessory from './Base.accessory';
import type { DPSState, DPSValue, HomebridgeCallback, RoomToWaterMapEntry } from '../types';
/**
 * Mapped Heat Pump Heater Accessory
 *
 * Provides a heater-style HomeKit interface where:
 * - Current temperature = tank/return temperature from device
 * - Target temperature = desired ROOM temperature (virtual, not sent to device)
 * - Actual device setpoint = mapped water temperature computed from room target
 */
declare class MappedHeatPumpHeaterAccessory extends BaseAccessory {
    static getCategory(Categories: any): number;
    virtualRoomTarget: number;
    dpActive: string;
    dpReturnTemperature: string;
    dpWaterTarget: string;
    dpOutsideTemperature: string | false;
    dpFlowTemperature: string | false;
    returnTemperatureDivisor: number;
    waterTargetDivisor: number;
    outsideTemperatureDivisor: number;
    flowTemperatureDivisor: number;
    roomTargetMin: number;
    roomTargetMax: number;
    waterTargetMin: number;
    waterTargetMax: number;
    roomToWaterMap: RoomToWaterMapEntry[];
    characteristicHeatingThresholdTemperature: any;
    constructor(...props: any[]);
    _registerPlatformAccessory(): void;
    _registerCharacteristics(dps: DPSState): void;
    getActive(callback: HomebridgeCallback): void;
    _getActive(dp: DPSValue): number;
    setActive(value: DPSValue, callback: HomebridgeCallback): void;
    getCurrentHeaterCoolerState(callback: HomebridgeCallback): void;
    _getCurrentHeaterCoolerState(dps: DPSState): number;
    getTargetHeaterCoolerState(callback: HomebridgeCallback): void;
    _getTargetHeaterCoolerState(): number;
    setTargetHeaterCoolerState(value: DPSValue, callback: HomebridgeCallback): void;
    getVirtualRoomTarget(callback: HomebridgeCallback): void;
    setVirtualRoomTarget(value: number, callback: HomebridgeCallback): void;
    /**
     * Map room temperature to water temperature using the mapping table
     * with linear interpolation between points
     */
    _mapRoomToWater(roomTemp: number): number;
}
export default MappedHeatPumpHeaterAccessory;
//# sourceMappingURL=MappedHeatPumpHeater.accessory.d.ts.map
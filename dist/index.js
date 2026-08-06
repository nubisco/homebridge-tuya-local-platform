"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TuyaAccessory_1 = __importDefault(require("./protocol/TuyaAccessory"));
const TuyaDiscovery_1 = __importDefault(require("./protocol/TuyaDiscovery"));
const accessories_1 = require("./accessories");
const PLUGIN_NAME = 'homebridge-tuya-local-platform';
const PLATFORM_NAME = 'TuyaLocalPlatform';
const CLASS_DEF = {
    outlet: accessories_1.OutletAccessory,
    simplelight: accessories_1.SimpleLightAccessory,
    rgbtwlight: accessories_1.RGBTWLightAccessory,
    rgbtwoutlet: accessories_1.RGBTWOutletAccessory,
    twlight: accessories_1.TWLightAccessory,
    multioutlet: accessories_1.MultiOutletAccessory,
    custommultioutlet: accessories_1.CustomMultiOutletAccessory,
    airconditioner: accessories_1.AirConditionerAccessory,
    airpurifier: accessories_1.AirPurifierAccessory,
    dehumidifier: accessories_1.DehumidifierAccessory,
    convector: accessories_1.ConvectorAccessory,
    garagedoor: accessories_1.GarageDoorAccessory,
    simpledimmer: accessories_1.SimpleDimmerAccessory,
    simpledimmer2: accessories_1.SimpleDimmer2Accessory,
    simpleblinds: accessories_1.SimpleBlindsAccessory,
    simpleheater: accessories_1.SimpleHeaterAccessory,
    mappedheatpumpheater: accessories_1.MappedHeatPumpHeaterAccessory,
    circuitbreakermonitor: accessories_1.CircuitBreakerMonitorAccessory,
    switch: accessories_1.SwitchAccessory,
    fan: accessories_1.SimpleFanAccessory,
    fanlight: accessories_1.SimpleFanLightAccessory,
    watervalve: accessories_1.ValveAccessory,
    oildiffuser: accessories_1.OilDiffuserAccessory,
};
let Characteristic, PlatformAccessory, Service, Categories, UUID;
module.exports = function (homebridge) {
    ;
    ({
        platformAccessory: PlatformAccessory,
        hap: {
            Characteristic,
            Service,
            // Homebridge 2.x / modern hap-nodejs exports Categories on hap itself.
            // Accessory.Categories is undefined there and crashes addAccessory with:
            //   TypeError: Cannot read properties of undefined (reading 'FAN')
            Categories,
            uuid: UUID,
        },
    } = homebridge);
    homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, TuyaLocalPlatform, true);
};
class TuyaLocalPlatform {
    log;
    config;
    api;
    cachedAccessories;
    _expectedUUIDs;
    constructor(...props) {
        ;
        [this.log, this.config, this.api] = [...props];
        this.cachedAccessories = new Map();
        this.api.hap.EnergyCharacteristics = (0, accessories_1.EnergyCharacteristicsFactory)(this.api.hap.Characteristic);
        if (!this.config || !this.config.devices) {
            this.log('No devices found. Check that you have specified them in your config.json file.');
            return;
        }
        this._expectedUUIDs = this.config.devices.map((device) => UUID.generate(PLUGIN_NAME + (device.fake ? ':fake:' : ':') + device.id));
        this.api.on('didFinishLaunching', () => {
            this.discoverDevices();
        });
    }
    discoverDevices() {
        const devices = {};
        const connectedDevices = [];
        const fakeDevices = [];
        this.config.devices.forEach((device) => {
            try {
                device.id = ('' + device.id).trim();
                device.key = ('' + device.key).trim();
                device.type = ('' + device.type).trim();
                device.ip = ('' + (device.ip || '')).trim();
            }
            catch (_ex) {
                /* ignore */
            }
            if (!device.type)
                return this.log.error("%s (%s) doesn't have a type defined.", device.name || 'Unnamed device', device.id);
            if (!CLASS_DEF[device.type.toLowerCase()])
                return this.log.error("%s (%s) doesn't have a valid type defined.", device.name || 'Unnamed device', device.id);
            if (device.fake)
                fakeDevices.push({ name: device.id.slice(8), ...device });
            else
                devices[device.id] = { name: device.id.slice(8), ...device };
        });
        const deviceIds = Object.keys(devices);
        if (deviceIds.length === 0)
            return this.log.error('No valid configured devices found.');
        this.log.info('Starting discovery...');
        TuyaDiscovery_1.default.start({ ids: deviceIds, log: this.log }).on('discover', (config) => {
            if (!config || !config.id)
                return;
            if (!devices[config.id])
                return this.log.warn('Discovered a device that has not been configured yet (%s@%s).', config.id, config.ip);
            connectedDevices.push(config.id);
            this.log.info('Discovered %s (%s) identified as %s (%s)', devices[config.id].name, config.id, devices[config.id].type, config.version);
            try {
                const device = new TuyaAccessory_1.default({
                    ...devices[config.id],
                    ...config,
                    log: this.log,
                    UUID: UUID.generate(PLUGIN_NAME + ':' + config.id),
                    connect: false,
                });
                this.addAccessory(device);
            }
            catch (err) {
                this.log.error('Failed to add discovered accessory %s (%s): %s', devices[config.id].name, config.id, err && err.stack ? err.stack : err);
            }
        });
        fakeDevices.forEach((config) => {
            this.log.info('Adding fake device: %s', config.name);
            this.addAccessory(new TuyaAccessory_1.default({
                ...config,
                log: this.log,
                UUID: UUID.generate(PLUGIN_NAME + ':fake:' + config.id),
                connect: false,
            }));
        });
        setTimeout(() => {
            deviceIds.forEach((deviceId) => {
                if (connectedDevices.includes(deviceId))
                    return;
                if (devices[deviceId].ip) {
                    this.log.info('Failed to discover %s (%s) in time but will connect via %s.', devices[deviceId].name, deviceId, devices[deviceId].ip);
                    try {
                        const device = new TuyaAccessory_1.default({
                            ...devices[deviceId],
                            log: this.log,
                            UUID: UUID.generate(PLUGIN_NAME + ':' + deviceId),
                            connect: false,
                        });
                        this.addAccessory(device);
                    }
                    catch (err) {
                        this.log.error('Failed to add accessory %s (%s): %s', devices[deviceId].name, deviceId, err && err.stack ? err.stack : err);
                    }
                }
                else {
                    this.log.warn('Failed to discover %s (%s) in time but will keep looking.', devices[deviceId].name, deviceId);
                }
            });
        }, 60000);
    }
    registerPlatformAccessories(platformAccessories) {
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, Array.isArray(platformAccessories) ? platformAccessories : [platformAccessories]);
    }
    configureAccessory(accessory) {
        if (accessory instanceof PlatformAccessory && this._expectedUUIDs && this._expectedUUIDs.includes(accessory.UUID)) {
            this.cachedAccessories.set(accessory.UUID, accessory);
            accessory.services.forEach((service) => {
                if (service.UUID === Service.AccessoryInformation.UUID)
                    return;
                service.characteristics.some((characteristic) => {
                    if (!characteristic.props ||
                        !Array.isArray(characteristic.props.perms) ||
                        characteristic.props.perms.length !== 3 ||
                        !(characteristic.props.perms.includes(Characteristic.Perms.WRITE) &&
                            characteristic.props.perms.includes(Characteristic.Perms.NOTIFY)))
                        return;
                    this.log.info('Marked %s unreachable by faulting Service.%s.%s', accessory.displayName, service.displayName, characteristic.displayName);
                    characteristic.updateValue(new Error('Unreachable'));
                    return true;
                });
            });
        }
        else {
            setTimeout(() => {
                this.removeAccessory(accessory);
            }, 1000);
        }
    }
    addAccessory(device) {
        const deviceConfig = device.context;
        const type = (deviceConfig.type || '').toLowerCase();
        const Accessory = CLASS_DEF[type];
        let accessory = this.cachedAccessories.get(deviceConfig.UUID);
        let isCached = true;
        if (accessory && accessory.category !== Accessory.getCategory(Categories)) {
            this.log.info('%s has a different type (%s vs %s)', accessory.displayName, accessory.category, Accessory.getCategory(Categories));
            this.removeAccessory(accessory);
            accessory = null;
        }
        if (!accessory) {
            accessory = new PlatformAccessory(deviceConfig.name, deviceConfig.UUID, Accessory.getCategory(Categories));
            accessory
                .getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, deviceConfig.manufacturer || 'Unknown')
                .setCharacteristic(Characteristic.Model, deviceConfig.model || 'Unknown')
                .setCharacteristic(Characteristic.SerialNumber, deviceConfig.id.slice(8));
            isCached = false;
        }
        if (accessory && accessory.displayName !== deviceConfig.name) {
            this.log.info('Configuration name %s differs from cached displayName %s. Updating cached displayName to %s ', deviceConfig.name, accessory.displayName, deviceConfig.name);
            accessory.displayName = deviceConfig.name;
        }
        this.cachedAccessories.set(deviceConfig.UUID, new Accessory(this, accessory, device, !isCached));
    }
    removeAccessory(homebridgeAccessory) {
        if (!homebridgeAccessory)
            return;
        this.log.warn('Unregistering', homebridgeAccessory.displayName);
        this.cachedAccessories.delete(homebridgeAccessory.UUID);
        this.api.unregisterPlatformAccessories(PLATFORM_NAME, PLATFORM_NAME, [homebridgeAccessory]);
    }
    removeAccessoryByUUID(uuid) {
        if (uuid)
            this.removeAccessory(this.cachedAccessories.get(uuid));
    }
}
//# sourceMappingURL=index.js.map
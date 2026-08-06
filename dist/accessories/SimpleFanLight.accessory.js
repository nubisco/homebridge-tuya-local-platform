"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Base_accessory_1 = __importDefault(require("./Base.accessory"));
class SimpleFanLightAccessory extends Base_accessory_1.default {
    static getCategory(Categories) {
        return Categories.FAN;
    }
    dpFanOn;
    dpRotationSpeed;
    dpLightOn;
    dpBrightness;
    useLight;
    useBrightness;
    maxSpeed;
    fanDefaultSpeed;
    fanCurrentSpeed;
    useStrings;
    constructor(...props) {
        super(...props);
    }
    _registerPlatformAccessory() {
        const { Service } = this.hap;
        this.accessory.addService(Service.Fan, this.device.context.name);
        this.accessory.addService(Service.Lightbulb, this.device.context.name + ' Light');
        super._registerPlatformAccessory();
    }
    _registerCharacteristics(dps) {
        const { Service, Characteristic } = this.hap;
        const serviceFan = this.accessory.getService(Service.Fan);
        const serviceLightbulb = this.accessory.getService(Service.Lightbulb);
        this._checkServiceName(serviceFan, this.device.context.name);
        this._checkServiceName(serviceLightbulb, this.device.context.name + ' Light');
        this.dpFanOn = this._getCustomDP(this.device.context.dpFanOn) || '1';
        this.dpRotationSpeed = this._getCustomDP(this.device.context.dpRotationSpeed) || '3';
        this.dpLightOn = this._getCustomDP(this.device.context.dpLightOn) || '9';
        this.dpBrightness = this._getCustomDP(this.device.context.dpBrightness) || '10';
        this.useLight = this._coerceBoolean(this.device.context.useLight, true);
        this.useBrightness = this._coerceBoolean(this.device.context.useBrightness, false);
        this.maxSpeed = parseInt(this.device.context.maxSpeed) || 3;
        this.fanDefaultSpeed = parseInt(this.device.context.fanDefaultSpeed) || 1;
        this.fanCurrentSpeed = 0;
        this.useStrings = this._coerceBoolean(this.device.context.useStrings, true);
        const characteristicFanOn = serviceFan
            .getCharacteristic(Characteristic.On)
            .updateValue(this._getFanOn(dps[this.dpFanOn]))
            .on('get', this.getFanOn.bind(this))
            .on('set', this.setFanOn.bind(this));
        const characteristicRotationSpeed = serviceFan
            .getCharacteristic(Characteristic.RotationSpeed)
            .setProps({
            minValue: 0,
            maxValue: 100,
            minStep: Math.max(100 / this.maxSpeed),
        })
            .updateValue(this.convertRotationSpeedFromTuyaToHomeKit(dps[this.dpRotationSpeed]))
            .on('get', this.getSpeed.bind(this))
            .on('set', this.setSpeed.bind(this));
        let characteristicLightOn;
        let characteristicBrightness;
        if (this.useLight) {
            characteristicLightOn = serviceLightbulb
                .getCharacteristic(Characteristic.On)
                .updateValue(this._getLightOn(dps[this.dpLightOn]))
                .on('get', this.getLightOn.bind(this))
                .on('set', this.setLightOn.bind(this));
            if (this.useBrightness) {
                characteristicBrightness = serviceLightbulb
                    .getCharacteristic(Characteristic.Brightness)
                    .setProps({
                    minValue: 0,
                    maxValue: 1000,
                    minStep: 100,
                })
                    .updateValue(this.convertBrightnessFromTuyaToHomeKit(dps[this.dpBrightness]))
                    .on('get', this.getBrightness.bind(this))
                    .on('set', this.setBrightness.bind(this));
            }
        }
        this.device.on('change', (changes, state) => {
            if (changes.hasOwnProperty(this.dpFanOn) && characteristicFanOn.value !== changes[this.dpFanOn])
                characteristicFanOn.updateValue(changes[this.dpFanOn]);
            if (changes.hasOwnProperty(this.dpRotationSpeed) &&
                this.convertRotationSpeedFromHomeKitToTuya(characteristicRotationSpeed.value) !==
                    changes[this.dpRotationSpeed])
                characteristicRotationSpeed.updateValue(this.convertRotationSpeedFromTuyaToHomeKit(changes[this.dpRotationSpeed]));
            if (changes.hasOwnProperty(this.dpLightOn) &&
                characteristicLightOn &&
                characteristicLightOn.value !== changes[this.dpLightOn])
                characteristicLightOn.updateValue(changes[this.dpLightOn]);
            if (changes.hasOwnProperty(this.dpBrightness) &&
                characteristicBrightness &&
                characteristicBrightness.value !== changes[this.dpBrightness])
                characteristicBrightness.updateValue(changes[this.dpBrightness]);
            this.log.debug('SimpleFanLight changed: ' + JSON.stringify(state));
        });
    }
    getFanOn(callback) {
        this.getState(this.dpFanOn, (err, dp) => {
            if (err)
                return callback(err);
            callback(null, this._getFanOn(dp));
        });
    }
    _getFanOn(dp) {
        return dp;
    }
    setFanOn(value, callback) {
        if (value == false) {
            this.fanCurrentSpeed = 0;
            return this.setState(this.dpFanOn, false, callback);
        }
        else {
            if (this.fanCurrentSpeed === 0) {
                if (this.useStrings) {
                    return this.setMultiStateLegacy({ [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanDefaultSpeed.toString() }, callback);
                }
                else {
                    return this.setMultiStateLegacy({ [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanDefaultSpeed }, callback);
                }
            }
            else {
                if (this.useStrings) {
                    return this.setMultiStateLegacy({ [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanCurrentSpeed.toString() }, callback);
                }
                else {
                    return this.setMultiStateLegacy({ [this.dpFanOn]: value, [this.dpRotationSpeed]: this.fanCurrentSpeed }, callback);
                }
            }
        }
    }
    getSpeed(callback) {
        this.getState(this.dpRotationSpeed, (err, _dp) => {
            if (err)
                return callback(err);
            callback(null, this.convertRotationSpeedFromTuyaToHomeKit(this.device.state[this.dpRotationSpeed]));
        });
    }
    setSpeed(value, callback) {
        if (value === 0) {
            if (this.useStrings) {
                return this.setMultiStateLegacy({ [this.dpFanOn]: false, [this.dpRotationSpeed]: this.fanDefaultSpeed.toString() }, callback);
            }
            else {
                return this.setMultiStateLegacy({ [this.dpFanOn]: false, [this.dpRotationSpeed]: this.fanDefaultSpeed }, callback);
            }
        }
        else {
            this.fanCurrentSpeed = this.convertRotationSpeedFromHomeKitToTuya(value);
            if (this.useStrings) {
                return this.setMultiStateLegacy({
                    [this.dpFanOn]: true,
                    [this.dpRotationSpeed]: this.convertRotationSpeedFromHomeKitToTuya(value).toString(),
                }, callback);
            }
            else {
                return this.setMultiStateLegacy({ [this.dpFanOn]: true, [this.dpRotationSpeed]: this.convertRotationSpeedFromHomeKitToTuya(value) }, callback);
            }
        }
    }
    getLightOn(callback) {
        this.getState(this.dpLightOn, (err, dp) => {
            if (err)
                return callback(err);
            callback(null, this._getLightOn(dp));
        });
    }
    _getLightOn(dp) {
        return dp;
    }
    setLightOn(value, callback) {
        return this.setState(this.dpLightOn, value, callback);
    }
    getBrightness(callback) {
        this.getState(this.dpBrightness, (err, dp) => {
            if (err)
                return callback(err);
            callback(null, this._getBrightness(dp));
        });
    }
    _getBrightness(dp) {
        return dp;
    }
    setBrightness(value, callback) {
        return this.setState(this.dpBrightness, value, callback);
    }
}
exports.default = SimpleFanLightAccessory;
//# sourceMappingURL=SimpleFanLight.accessory.js.map
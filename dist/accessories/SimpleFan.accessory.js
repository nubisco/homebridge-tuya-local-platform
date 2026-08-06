"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Base_accessory_1 = __importDefault(require("./Base.accessory"));
class SimpleFanAccessory extends Base_accessory_1.default {
    static getCategory(Categories) {
        return Categories.FAN;
    }
    dpFanOn;
    dpRotationSpeed;
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
        super._registerPlatformAccessory();
    }
    _registerCharacteristics(dps) {
        const { Service, Characteristic } = this.hap;
        const serviceFan = this.accessory.getService(Service.Fan);
        this._checkServiceName(serviceFan, this.device.context.name);
        this.dpFanOn = this._getCustomDP(this.device.context.dpFanOn) || '1';
        this.dpRotationSpeed = this._getCustomDP(this.device.context.dpRotationSpeed) || '3';
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
        this.device.on('change', (changes, state) => {
            if (changes.hasOwnProperty(this.dpFanOn) && characteristicFanOn.value !== changes[this.dpFanOn])
                characteristicFanOn.updateValue(changes[this.dpFanOn]);
            if (changes.hasOwnProperty(this.dpRotationSpeed) &&
                this.convertRotationSpeedFromHomeKitToTuya(characteristicRotationSpeed.value) !==
                    changes[this.dpRotationSpeed])
                characteristicRotationSpeed.updateValue(this.convertRotationSpeedFromTuyaToHomeKit(changes[this.dpRotationSpeed]));
            this.log.debug('SimpleFan changed: ' + JSON.stringify(state));
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
}
exports.default = SimpleFanAccessory;
//# sourceMappingURL=SimpleFan.accessory.js.map
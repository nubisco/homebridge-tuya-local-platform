"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Base_accessory_1 = __importDefault(require("./Base.accessory"));
const async_1 = __importDefault(require("async"));
class SwitchAccessory extends Base_accessory_1.default {
    static getCategory(Categories) {
        return Categories.SWITCH;
    }
    _justRegistered;
    _pendingPower = null;
    constructor(...props) {
        super(...props);
    }
    _registerPlatformAccessory() {
        this._verifyCachedPlatformAccessory();
        this._justRegistered = true;
        super._registerPlatformAccessory();
    }
    _verifyCachedPlatformAccessory() {
        if (this._justRegistered)
            return;
        const { Service } = this.hap;
        const switchCount = parseInt(this.device.context.switchCount) || 1;
        const _validServices = [];
        for (let i = 0; i++ < switchCount;) {
            let service = this.accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch ' + i);
            if (service)
                this._checkServiceName(service, this.device.context.name + ' ' + i);
            else
                service = this.accessory.addService(Service.Switch, this.device.context.name + ' ' + i, 'switch ' + i);
            _validServices.push(service);
        }
        this.accessory.services
            .filter((service) => service.UUID === Service.Switch.UUID && !_validServices.includes(service))
            .forEach((service) => {
            this.log.info('Removing', service.displayName);
            this.accessory.removeService(service);
        });
    }
    _registerCharacteristics(dps) {
        this._verifyCachedPlatformAccessory();
        const { Service, Characteristic } = this.hap;
        const characteristics = {};
        this.accessory.services.forEach((service) => {
            if (service.UUID !== Service.Switch.UUID || !service.subtype)
                return false;
            let match;
            if ((match = service.subtype.match(/^switch (\d+)$/)) === null)
                return;
            characteristics[match[1]] = service
                .getCharacteristic(Characteristic.On)
                .updateValue(dps[match[1]])
                .on('get', this.getPower.bind(this, match[1]))
                .on('set', this.setPower.bind(this, match[1]));
        });
        this.device.on('change', (changes, _state) => {
            Object.keys(changes).forEach((key) => {
                if (characteristics[key] && characteristics[key].value !== changes[key])
                    characteristics[key].updateValue(changes[key]);
            });
        });
    }
    getPower(dp, callback) {
        callback(null, this.device.state[dp]);
    }
    setPower(dp, value, callback) {
        if (!this._pendingPower) {
            this._pendingPower = { props: {}, callbacks: [] };
        }
        if (dp) {
            if (this._pendingPower.timer)
                clearTimeout(this._pendingPower.timer);
            this._pendingPower.props = { ...this._pendingPower.props, ...{ [dp]: value } };
            this._pendingPower.callbacks.push(callback);
            this._pendingPower.timer = setTimeout(() => {
                this.setPower();
            }, 500);
            return;
        }
        const callbacks = this._pendingPower.callbacks;
        const callEachBack = (err) => {
            async_1.default.eachSeries(callbacks, (callback, next) => {
                try {
                    callback(err);
                }
                catch (_ex) {
                    /* ignore */
                }
                next();
            });
        };
        const newValue = this._pendingPower.props;
        this._pendingPower = null;
        this.setMultiState(newValue, callEachBack);
    }
}
exports.default = SwitchAccessory;
//# sourceMappingURL=Switch.accessory.js.map
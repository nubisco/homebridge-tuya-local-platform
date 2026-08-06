"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Base_accessory_1 = __importDefault(require("./Base.accessory"));
class SimpleLightAccessory extends Base_accessory_1.default {
    static getCategory(Categories) {
        return Categories.LIGHTBULB;
    }
    dpPower;
    constructor(...props) {
        super(...props);
    }
    _registerPlatformAccessory() {
        const { Service } = this.hap;
        this.accessory.addService(Service.Lightbulb, this.device.context.name);
        super._registerPlatformAccessory();
    }
    _registerCharacteristics(dps) {
        const { Service, Characteristic } = this.hap;
        const service = this.accessory.getService(Service.Lightbulb);
        this._checkServiceName(service, this.device.context.name);
        this.dpPower = this._getCustomDP(this.device.context.dpPower) || '1';
        const characteristicOn = service
            .getCharacteristic(Characteristic.On)
            .updateValue(dps[this.dpPower])
            .on('get', this.getState.bind(this, this.dpPower))
            .on('set', this.setState.bind(this, this.dpPower));
        this.device.on('change', (changes, state) => {
            if (changes.hasOwnProperty(this.dpPower) && characteristicOn.value !== changes[this.dpPower])
                characteristicOn.updateValue(changes[this.dpPower]);
            this.log.info('SimpleLight changed: ' + JSON.stringify(state));
        });
    }
}
exports.default = SimpleLightAccessory;
//# sourceMappingURL=SimpleLight.accessory.js.map
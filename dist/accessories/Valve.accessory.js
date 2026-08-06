"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Base_accessory_1 = __importDefault(require("./Base.accessory"));
class ValveAccessory extends Base_accessory_1.default {
    static getCategory(Categories) {
        return Categories.FAUCET;
    }
    dpPower;
    setDuration;
    noTimer;
    lastActivationTime = null;
    timer = null;
    constructor(...props) {
        super(...props);
    }
    _registerPlatformAccessory() {
        const { Service } = this.hap;
        this.accessory.addService(Service.Valve, this.device.context.name);
        super._registerPlatformAccessory();
    }
    _registerCharacteristics(dps) {
        const { Service, Characteristic } = this.hap;
        const service = this.accessory.getService(Service.Valve);
        this._checkServiceName(service, this.device.context.name);
        this.setDuration = this.device.context.defaultDuration || 600;
        this.noTimer = this.device.context.noTimer;
        this.lastActivationTime = null;
        this.timer = null;
        switch (this.device.context.valveType) {
            case 'IRRIGATION':
                service.getCharacteristic(Characteristic.ValveType).updateValue(1);
                break;
            case 'SHOWER_HEAD':
                service.getCharacteristic(Characteristic.ValveType).updateValue(2);
                break;
            case 'WATER_FAUCET':
                service.getCharacteristic(Characteristic.ValveType).updateValue(3);
                break;
            default:
                service.getCharacteristic(Characteristic.ValveType).updateValue(0);
                break;
        }
        this.dpPower = this._getCustomDP(this.device.context.dpPower) || '1';
        const characteristicActive = service
            .getCharacteristic(Characteristic.Active)
            .updateValue(dps[this.dpPower])
            .on('get', this.getState.bind(this, this.dpPower))
            .on('set', this.setState.bind(this, this.dpPower));
        const characteristicInUse = service
            .getCharacteristic(Characteristic.InUse)
            .on('get', (next) => {
            next(null, characteristicActive.value);
        });
        if (!this.noTimer) {
            service
                .getCharacteristic(Characteristic.SetDuration)
                .on('get', (next) => {
                next(null, this.setDuration);
            })
                .on('change', (data) => {
                this.log.info('Water Valve Time Duration Set to: ' + data.newValue / 60 + ' Minutes');
                this.setDuration = data.newValue;
                if (service.getCharacteristic(Characteristic.InUse).value) {
                    this.lastActivationTime = new Date().getTime();
                    service.getCharacteristic(Characteristic.RemainingDuration).updateValue(data.newValue);
                    if (this.timer)
                        clearTimeout(this.timer);
                    this.timer = setTimeout(() => {
                        this.log.info('Water Valve Timer Expired. Shutting OFF Valve');
                        service.getCharacteristic(Characteristic.Active).setValue(0);
                        service.getCharacteristic(Characteristic.InUse).updateValue(0);
                        this.lastActivationTime = null;
                    }, data.newValue * 1000);
                }
            });
            service.getCharacteristic(Characteristic.RemainingDuration).on('get', (next) => {
                let remainingTime = this.setDuration - Math.floor((new Date().getTime() - (this.lastActivationTime || 0)) / 1000);
                if (!remainingTime || remainingTime < 0)
                    remainingTime = 0;
                next(null, remainingTime);
            });
            service.getCharacteristic(Characteristic.InUse).on('change', (data) => {
                switch (data.newValue) {
                    case 0:
                        this.lastActivationTime = null;
                        service.getCharacteristic(Characteristic.RemainingDuration).updateValue(0);
                        service.getCharacteristic(Characteristic.Active).updateValue(0);
                        if (this.timer)
                            clearTimeout(this.timer);
                        this.log.info('Water Valve is OFF!');
                        break;
                    case 1:
                        this.lastActivationTime = new Date().getTime();
                        service.getCharacteristic(Characteristic.RemainingDuration).updateValue(this.setDuration);
                        service.getCharacteristic(Characteristic.Active).updateValue(1);
                        this.log.info('Water Valve Turning ON with Timer Set to: ' + this.setDuration / 60 + ' Minutes');
                        if (this.timer)
                            clearTimeout(this.timer);
                        this.timer = setTimeout(() => {
                            this.log.info('Water Valve Timer Expired. Shutting OFF Valve');
                            service.getCharacteristic(Characteristic.Active).setValue(0);
                            service.getCharacteristic(Characteristic.InUse).updateValue(0);
                            this.lastActivationTime = null;
                        }, this.setDuration * 1000);
                        break;
                }
            });
            // If Homebridge crash when valve is on the timer reset
            if (dps[this.dpPower]) {
                this.lastActivationTime = new Date().getTime();
                service.getCharacteristic(Characteristic.RemainingDuration).updateValue(this.setDuration);
                service.getCharacteristic(Characteristic.Active).updateValue(1);
                service.getCharacteristic(Characteristic.InUse).updateValue(1);
                this.log.info('Water Valve is ON After Restart. Setting Timer to: ' + this.setDuration / 60 + ' Minutes');
                if (this.timer)
                    clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    this.log.info('Water Valve Timer Expired. Shutting OFF Valve');
                    service.getCharacteristic(Characteristic.Active).setValue(0);
                    this.lastActivationTime = null;
                }, this.setDuration * 1000);
            }
        }
        this.device.on('change', (changes) => {
            if (changes.hasOwnProperty(this.dpPower) && characteristicActive.value !== changes[this.dpPower])
                characteristicActive.updateValue(changes[this.dpPower]);
            if (changes.hasOwnProperty(this.dpPower) && characteristicInUse.value !== changes[this.dpPower])
                characteristicInUse.setValue(changes[this.dpPower]);
            if (!this.noTimer) {
                if (changes.hasOwnProperty(this.dpPower) && !changes[this.dpPower]) {
                    this.lastActivationTime = null;
                    service.getCharacteristic(Characteristic.RemainingDuration).updateValue(0);
                    if (this.timer)
                        clearTimeout(this.timer);
                }
            }
        });
    }
}
exports.default = ValveAccessory;
//# sourceMappingURL=Valve.accessory.js.map
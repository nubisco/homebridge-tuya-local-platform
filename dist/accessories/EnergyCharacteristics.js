"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createEnergyCharacteristics = (Characteristic) => {
    class EnergyCharacteristic extends Characteristic {
        static UUID = '';
        constructor(displayName, UUID) {
            super(displayName, UUID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
            });
            this.value = this.getDefaultValue();
        }
    }
    class Amperes extends EnergyCharacteristic {
        static UUID = 'E863F126-079E-48FF-8F27-9C2605A29F52';
        constructor() {
            super('Amperes', Amperes.UUID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'A',
                perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
                minStep: 0.001,
            });
            this.value = this.getDefaultValue();
        }
    }
    class KilowattHours extends EnergyCharacteristic {
        static UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';
        constructor() {
            super('Kilowatt Hours', KilowattHours.UUID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'kWh',
                perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
                minStep: 0.001,
            });
            this.value = this.getDefaultValue();
        }
    }
    class KilowattVoltAmpereHour extends EnergyCharacteristic {
        static UUID = 'E863F127-079E-48FF-8F27-9C2605A29F52';
        constructor() {
            super('Kilowatt Volt Ampere Hour', KilowattVoltAmpereHour.UUID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'kVAh',
                perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
                minStep: 0.001,
            });
            this.value = this.getDefaultValue();
        }
    }
    class VoltAmperes extends EnergyCharacteristic {
        static UUID = 'E863F110-079E-48FF-8F27-9C2605A29F52';
        constructor() {
            super('Volt Amperes', VoltAmperes.UUID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'VA',
                perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
                minStep: 0.001,
            });
            this.value = this.getDefaultValue();
        }
    }
    class Volts extends EnergyCharacteristic {
        static UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';
        constructor() {
            super('Volts', Volts.UUID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'V',
                perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
                minStep: 0.1,
            });
            this.value = this.getDefaultValue();
        }
    }
    class Watts extends EnergyCharacteristic {
        static UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
        constructor() {
            super('Watts', Watts.UUID);
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: 'W',
                perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
                minStep: 0.1,
            });
            this.value = this.getDefaultValue();
        }
    }
    return {
        Amperes: Amperes,
        KilowattHours: KilowattHours,
        KilowattVoltAmpereHour: KilowattVoltAmpereHour,
        VoltAmperes: VoltAmperes,
        Volts: Volts,
        Watts: Watts,
    };
};
exports.default = createEnergyCharacteristics;
//# sourceMappingURL=EnergyCharacteristics.js.map
import BaseAccessory from './Base.accessory';
import async from 'async';
import type { DPSState, DPSValue, HomebridgeCallback, HSBColor } from '../types';

interface PendingHueSaturation {
  props: Partial<HSBColor>;
  callbacks: HomebridgeCallback[];
  timer?: ReturnType<typeof setTimeout>;
}

class RGBTWOutletAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.OUTLET;
  }

  dpLight!: string;
  dpMode!: string;
  dpBrightness!: string;
  dpColorTemperature!: string;
  declare dpColor: string;
  dpPower!: string;
  cmdWhite!: string;
  cmdColor!: string;
  characteristicHue!: any;
  characteristicSaturation!: any;
  characteristicColorTemperature!: any;
  _justRegistered?: boolean;
  _pendingHueSaturation: PendingHueSaturation | null = null;

  constructor(...props: any[]) {
    super(...props);
  }

  _registerPlatformAccessory(): void {
    this._verifyCachedPlatformAccessory();
    this._justRegistered = true;
    super._registerPlatformAccessory();
  }

  _verifyCachedPlatformAccessory(): void {
    if (this._justRegistered) return;

    const { Service } = this.hap;

    const outletName = 'Outlet - ' + this.device.context.name;
    let outletService = this.accessory.getServiceByUUIDAndSubType(Service.Outlet, 'outlet');
    if (outletService) this._checkServiceName(outletService, outletName);
    else outletService = this.accessory.addService(Service.Outlet, outletName, 'outlet');

    const lightName = 'RGBTWLight - ' + this.device.context.name;
    let lightService = this.accessory.getServiceByUUIDAndSubType(Service.Lightbulb, 'lightbulb');
    if (lightService) this._checkServiceName(lightService, lightName);
    else lightService = this.accessory.addService(Service.Lightbulb, lightName, 'lightbulb');

    this.accessory.services.forEach((service: any) => {
      if (
        (service.UUID === Service.Outlet.UUID && service !== outletService) ||
        (service.UUID === Service.Lightbulb.UUID && service !== lightService)
      )
        this.accessory.removeService(service);
    });
  }

  _registerCharacteristics(dps: DPSState): void {
    this._verifyCachedPlatformAccessory();

    const { Service, Characteristic, EnergyCharacteristics } = this.hap;

    const outletService = this.accessory.getServiceByUUIDAndSubType(Service.Outlet, 'outlet');
    const lightService = this.accessory.getServiceByUUIDAndSubType(Service.Lightbulb, 'lightbulb');

    this.dpLight = this._getCustomDP(this.device.context.dpLight) || '1';
    this.dpMode = this._getCustomDP(this.device.context.dpMode) || '2';
    this.dpBrightness = this._getCustomDP(this.device.context.dpBrightness) || '3';
    this.dpColorTemperature = this._getCustomDP(this.device.context.dpColorTemperature) || '4';
    this.dpColor = this._getCustomDP(this.device.context.dpColor) || '5';
    this.dpPower = this._getCustomDP(this.device.context.dpPower) || '101';

    this._detectColorFunction(dps[this.dpColor]);

    this.cmdWhite = 'white';
    if (this.device.context.cmdWhite) {
      if (/^w[a-z]+$/i.test(this.device.context.cmdWhite)) this.cmdWhite = ('' + this.device.context.cmdWhite).trim();
      else throw new Error(`The cmdWhite doesn't appear to be valid: ${this.device.context.cmdWhite}`);
    }

    this.cmdColor = 'colour';
    if (this.device.context.cmdColor) {
      if (/^c[a-z]+$/i.test(this.device.context.cmdColor)) this.cmdColor = ('' + this.device.context.cmdColor).trim();
      else throw new Error(`The cmdColor doesn't appear to be valid: ${this.device.context.cmdColor}`);
    } else if (this.device.context.cmdColour) {
      if (/^c[a-z]+$/i.test(this.device.context.cmdColour)) this.cmdColor = ('' + this.device.context.cmdColour).trim();
      else throw new Error(`The cmdColour doesn't appear to be valid: ${this.device.context.cmdColour}`);
    }

    const energyKeys = {
      volts: this._getCustomDP(this.device.context.voltsId),
      voltsDivisor: parseInt(this.device.context.voltsDivisor) || 10,
      amps: this._getCustomDP(this.device.context.ampsId),
      ampsDivisor: parseInt(this.device.context.ampsDivisor) || 1000,
      watts: this._getCustomDP(this.device.context.wattsId),
      wattsDivisor: parseInt(this.device.context.wattsDivisor) || 10,
    };

    const characteristicLightOn = lightService
      .getCharacteristic(Characteristic.On)
      .updateValue(dps[this.dpLight])
      .on('get', this.getState.bind(this, this.dpLight))
      .on('set', this.setState.bind(this, this.dpLight));

    const characteristicBrightness = lightService
      .getCharacteristic(Characteristic.Brightness)
      .updateValue(
        dps[this.dpMode] === this.cmdWhite
          ? this.convertBrightnessFromTuyaToHomeKit(dps[this.dpBrightness])
          : this.convertColorFromTuyaToHomeKit(dps[this.dpColor]).b,
      )
      .on('get', this.getBrightness.bind(this))
      .on('set', this.setBrightness.bind(this));

    const characteristicColorTemperature = lightService
      .getCharacteristic(Characteristic.ColorTemperature)
      .setProps({
        minValue: 0,
        maxValue: 600,
      })
      .updateValue(
        dps[this.dpMode] === this.cmdWhite
          ? this.convertColorTemperatureFromTuyaToHomeKit(dps[this.dpColorTemperature])
          : 0,
      )
      .on('get', this.getColorTemperature.bind(this))
      .on('set', this.setColorTemperature.bind(this));

    const characteristicHue = lightService
      .getCharacteristic(Characteristic.Hue)
      .updateValue(dps[this.dpMode] === this.cmdWhite ? 0 : this.convertColorFromTuyaToHomeKit(dps[this.dpColor]).h)
      .on('get', this.getHue.bind(this))
      .on('set', this.setHue.bind(this));

    const characteristicSaturation = lightService
      .getCharacteristic(Characteristic.Saturation)
      .updateValue(dps[this.dpMode] === this.cmdWhite ? 0 : this.convertColorFromTuyaToHomeKit(dps[this.dpColor]).s)
      .on('get', this.getSaturation.bind(this))
      .on('set', this.setSaturation.bind(this));

    this.characteristicHue = characteristicHue;
    this.characteristicSaturation = characteristicSaturation;
    this.characteristicColorTemperature = characteristicColorTemperature;

    let characteristicVolts: any;
    if (energyKeys.volts) {
      characteristicVolts = outletService
        .getCharacteristic(EnergyCharacteristics.Volts)
        .updateValue(this._getDividedState(dps[energyKeys.volts], energyKeys.voltsDivisor))
        .on('get', this.getDividedState.bind(this, energyKeys.volts, energyKeys.voltsDivisor));
    } else this._removeCharacteristic(outletService, EnergyCharacteristics.Volts);

    let characteristicAmps: any;
    if (energyKeys.amps) {
      characteristicAmps = outletService
        .getCharacteristic(EnergyCharacteristics.Amperes)
        .updateValue(this._getDividedState(dps[energyKeys.amps], energyKeys.ampsDivisor))
        .on('get', this.getDividedState.bind(this, energyKeys.amps, energyKeys.ampsDivisor));
    } else this._removeCharacteristic(outletService, EnergyCharacteristics.Amperes);

    let characteristicWatts: any;
    if (energyKeys.watts) {
      characteristicWatts = outletService
        .getCharacteristic(EnergyCharacteristics.Watts)
        .updateValue(this._getDividedState(dps[energyKeys.watts], energyKeys.wattsDivisor))
        .on('get', this.getDividedState.bind(this, energyKeys.watts, energyKeys.wattsDivisor));
    } else this._removeCharacteristic(outletService, EnergyCharacteristics.Watts);

    const characteristicOutletOn = outletService
      .getCharacteristic(Characteristic.On)
      .updateValue(dps[this.dpPower])
      .on('get', this.getState.bind(this, this.dpPower))
      .on('set', this.setState.bind(this, this.dpPower));

    this.device.on('change', (changes: DPSState, state: DPSState) => {
      if (changes.hasOwnProperty(this.dpLight) && characteristicLightOn.value !== changes[this.dpLight])
        characteristicLightOn.updateValue(changes[this.dpLight]);

      switch (state[this.dpMode]) {
        case this.cmdWhite:
          if (
            changes.hasOwnProperty(this.dpBrightness) &&
            this.convertBrightnessFromHomeKitToTuya(characteristicBrightness.value as number) !==
              changes[this.dpBrightness]
          )
            characteristicBrightness.updateValue(this.convertBrightnessFromTuyaToHomeKit(changes[this.dpBrightness]));

          if (
            changes.hasOwnProperty(this.dpColorTemperature) &&
            this.convertColorTemperatureFromHomeKitToTuya(characteristicColorTemperature.value as number) !==
              changes[this.dpColorTemperature]
          ) {
            const newColorTemperature = this.convertColorTemperatureFromTuyaToHomeKit(changes[this.dpColorTemperature]);
            const newColor = this.convertHomeKitColorTemperatureToHomeKitColor(newColorTemperature);
            characteristicHue.updateValue(newColor.h);
            characteristicSaturation.updateValue(newColor.s);
            characteristicColorTemperature.updateValue(newColorTemperature);
          } else if (changes[this.dpMode] && !changes.hasOwnProperty(this.dpColorTemperature)) {
            const newColorTemperature = this.convertColorTemperatureFromTuyaToHomeKit(state[this.dpColorTemperature]);
            const newColor = this.convertHomeKitColorTemperatureToHomeKitColor(newColorTemperature);
            characteristicHue.updateValue(newColor.h);
            characteristicSaturation.updateValue(newColor.s);
            characteristicColorTemperature.updateValue(newColorTemperature);
          }
          break;

        default:
          if (changes.hasOwnProperty(this.dpColor)) {
            const oldColor = this.convertColorFromTuyaToHomeKit(
              this.convertColorFromHomeKitToTuya({
                h: characteristicHue.value as number,
                s: characteristicSaturation.value as number,
                b: characteristicBrightness.value as number,
              }),
            );
            const newColor = this.convertColorFromTuyaToHomeKit(changes[this.dpColor]);

            if (oldColor.b !== newColor.b) characteristicBrightness.updateValue(newColor.b);
            if (oldColor.h !== newColor.h) characteristicHue.updateValue(newColor.h);
            if (oldColor.s !== newColor.s) characteristicSaturation.updateValue(newColor.h);
            if (characteristicColorTemperature.value !== 0) characteristicColorTemperature.updateValue(0);
          } else if (changes[this.dpMode]) {
            if (characteristicColorTemperature.value !== 0) characteristicColorTemperature.updateValue(0);
          }
      }

      if (changes.hasOwnProperty(this.dpPower) && characteristicOutletOn.value !== changes[this.dpPower])
        characteristicOutletOn.updateValue(changes[this.dpPower]);

      if (changes.hasOwnProperty(energyKeys.volts as string) && characteristicVolts) {
        const newVolts = this._getDividedState(changes[energyKeys.volts as string], energyKeys.voltsDivisor);
        if (characteristicVolts.value !== newVolts) characteristicVolts.updateValue(newVolts);
      }

      if (changes.hasOwnProperty(energyKeys.amps as string) && characteristicAmps) {
        const newAmps = this._getDividedState(changes[energyKeys.amps as string], energyKeys.ampsDivisor);
        if (characteristicAmps.value !== newAmps) characteristicAmps.updateValue(newAmps);
      }

      if (changes.hasOwnProperty(energyKeys.watts as string) && characteristicWatts) {
        const newWatts = this._getDividedState(changes[energyKeys.watts as string], energyKeys.wattsDivisor);
        if (characteristicWatts.value !== newWatts) characteristicWatts.updateValue(newWatts);
      }
    });
  }

  getBrightness(callback: HomebridgeCallback): void {
    if (this.device.state[this.dpMode] === this.cmdWhite)
      return callback(null, this.convertBrightnessFromTuyaToHomeKit(this.device.state[this.dpBrightness]));
    callback(null, this.convertColorFromTuyaToHomeKit(this.device.state[this.dpColor]).b);
  }

  setBrightness(value: DPSValue, callback: HomebridgeCallback): void {
    if (this.device.state[this.dpMode] === this.cmdWhite)
      return this.setState(this.dpBrightness, this.convertBrightnessFromHomeKitToTuya(value), callback);
    this.setState(this.dpColor, this.convertColorFromHomeKitToTuya({ b: value as number }), callback);
  }

  getColorTemperature(callback: HomebridgeCallback): void {
    if (this.device.state[this.dpMode] !== this.cmdWhite) return callback(null, 0);
    callback(null, this.convertColorTemperatureFromTuyaToHomeKit(this.device.state[this.dpColorTemperature]));
  }

  setColorTemperature(value: DPSValue, callback: HomebridgeCallback): void {
    if (value === 0) return callback(null, true);

    const newColor = this.convertHomeKitColorTemperatureToHomeKitColor(value as number);
    this.characteristicHue.updateValue(newColor.h);
    this.characteristicSaturation.updateValue(newColor.s);

    this.setMultiState(
      { [this.dpMode]: this.cmdWhite, [this.dpColorTemperature]: this.convertColorTemperatureFromHomeKitToTuya(value) },
      callback,
    );
  }

  getHue(callback: HomebridgeCallback): void {
    if (this.device.state[this.dpMode] === this.cmdWhite) return callback(null, 0);
    callback(null, this.convertColorFromTuyaToHomeKit(this.device.state[this.dpColor]).h);
  }

  setHue(value: DPSValue, callback: HomebridgeCallback): void {
    this._setHueSaturation({ h: value as number }, callback);
  }

  getSaturation(callback: HomebridgeCallback): void {
    if (this.device.state[this.dpMode] === this.cmdWhite) return callback(null, 0);
    callback(null, this.convertColorFromTuyaToHomeKit(this.device.state[this.dpColor]).s);
  }

  setSaturation(value: DPSValue, callback: HomebridgeCallback): void {
    this._setHueSaturation({ s: value as number }, callback);
  }

  _setHueSaturation(prop?: Partial<HSBColor>, callback?: HomebridgeCallback): void {
    if (!this._pendingHueSaturation) {
      this._pendingHueSaturation = { props: {}, callbacks: [] };
    }

    if (prop) {
      if (this._pendingHueSaturation.timer) clearTimeout(this._pendingHueSaturation.timer);

      this._pendingHueSaturation.props = { ...this._pendingHueSaturation.props, ...prop };
      this._pendingHueSaturation.callbacks.push(callback!);

      this._pendingHueSaturation.timer = setTimeout(() => {
        this._setHueSaturation();
      }, 500);
      return;
    }

    const callbacks = this._pendingHueSaturation!.callbacks;
    const callEachBack = (err?: Error | null) => {
      async.eachSeries(
        callbacks,
        (cb: HomebridgeCallback, next: () => void) => {
          try {
            cb(err || null);
          } catch (_ex) {
            /* ignore */
          }
          next();
        },
        () => {
          this.characteristicColorTemperature.updateValue(0);
        },
      );
    };

    const isSham = this._pendingHueSaturation!.props.h === 0 && this._pendingHueSaturation!.props.s === 0;
    const newValue = this.convertColorFromHomeKitToTuya(this._pendingHueSaturation!.props);
    this._pendingHueSaturation = null;

    if (this.device.state[this.dpMode] === this.cmdWhite && isSham) return callEachBack();

    this.setMultiState({ [this.dpMode]: this.cmdColor, [this.dpColor]: newValue }, callEachBack);
  }
}

export default RGBTWOutletAccessory;

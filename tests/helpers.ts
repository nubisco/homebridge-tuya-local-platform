import { EventEmitter } from 'events';
import type { DPSState, TuyaDeviceContext } from '../src/types';

/**
 * Minimal mock logger matching the Homebridge Logger interface.
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  };
}

/**
 * Minimal mock Characteristic class factory.
 * Returns an object with common characteristic constants.
 */
export function createMockCharacteristic() {
  return {
    Name: { UUID: 'name-uuid' },
    Manufacturer: 'manufacturer',
    Model: 'model',
    SerialNumber: 'serial',
    CurrentTemperature: 'current-temperature',
    CurrentRelativeHumidity: 'current-humidity',
    Active: { ACTIVE: 1, INACTIVE: 0 },
    Perms: { WRITE: 'pw', NOTIFY: 'ev', READ: 'pr' },
    On: 'on',
    LockCurrentState: 'lock-current',
    LockTargetState: 'lock-target',
    RelativeHumidityDehumidifierThreshold: 'humidity-threshold',
    CurrentHumidifierDehumidifierState: { DEHUMIDIFYING: 2 },
    TargetHumidifierDehumidifierState: { DEHUMIDIFIER: 2 },
    RotationSpeed: 'rotation-speed',
    SwingMode: { UUID: 'swing-uuid' },
    WaterLevel: 'water-level',
  };
}

/**
 * Minimal mock Service factory.
 */
export function createMockService() {
  return {
    AccessoryInformation: { UUID: 'accessory-info-uuid' },
    TemperatureSensor: 'temp-sensor',
    HumiditySensor: 'humidity-sensor',
    HumidifierDehumidifier: 'dehumidifier',
    LockMechanism: 'lock',
    Fan: 'fan',
    HeaterCooler: 'heater-cooler',
    ContactSensor: 'contact-sensor',
    LeakSensor: 'leak-sensor',
  };
}

/**
 * Minimal mock HAP Categories.
 */
export function createMockCategories() {
  return {
    AIR_DEHUMIDIFIER: 23,
    AIR_HEATER: 20,
    AIR_CONDITIONER: 21,
    AIR_PURIFIER: 19,
    FAN: 3,
    LIGHTBULB: 5,
    OUTLET: 7,
    SWITCH: 8,
    SENSOR: 10,
    WINDOW_COVERING: 14,
    GARAGE_DOOR_OPENER: 4,
    FAUCET: 29,
  };
}

/**
 * Create a mock TuyaAccessory (protocol client) that extends EventEmitter.
 */
export function createMockTuyaDevice(overrides: Partial<TuyaDeviceContext> = {}): EventEmitter & {
  context: TuyaDeviceContext;
  state: DPSState;
  connected: boolean;
  update: ReturnType<typeof vi.fn>;
  _connect: ReturnType<typeof vi.fn>;
} {
  const device = new EventEmitter() as any;
  device.context = {
    id: 'test-device-id-001',
    key: 'test-local-key-16c',
    ip: '192.168.1.100',
    name: 'Test Device',
    type: 'outlet',
    version: '3.3',
    UUID: 'test-uuid-001',
    log: createMockLogger(),
    connect: false,
    ...overrides,
  };
  device.state = {};
  device.connected = false;
  device.update = vi.fn().mockReturnValue(true);
  device._connect = vi.fn();
  return device;
}

/**
 * Create a mock Homebridge PlatformAccessory.
 */
export function createMockPlatformAccessory(name = 'Test', uuid = 'test-uuid') {
  const services = new Map<string, any>();
  const accessory: any = {
    UUID: uuid,
    displayName: name,
    category: undefined,
    services: [],
    on: vi.fn(),
    getService: vi.fn((type: string) => services.get(type)),
    addService: vi.fn((type: string, displayName: string) => {
      const service = createMockHAPService(type, displayName);
      services.set(type, service);
      accessory.services.push(service);
      return service;
    }),
  };
  // Pre-add AccessoryInformation
  const infoService = createMockHAPService('accessory-info-uuid', 'Accessory Information');
  infoService.UUID = 'accessory-info-uuid';
  services.set('accessory-info-uuid', infoService);
  accessory.services.push(infoService);

  return accessory;
}

/**
 * Create a mock HAP Service with chainable characteristic methods.
 */
function createMockHAPService(type: string, displayName?: string) {
  const characteristics = new Map<string, any>();

  const service: any = {
    UUID: type,
    displayName: displayName || type,
    characteristics: [],
    getCharacteristic: vi.fn((charType: any) => {
      const key = typeof charType === 'object' ? charType.UUID || charType : charType;
      if (!characteristics.has(key)) {
        const char = createMockCharacteristicInstance(key);
        characteristics.set(key, char);
        service.characteristics.push(char);
      }
      return characteristics.get(key);
    }),
    addCharacteristic: vi.fn((charType: any) => {
      const key = typeof charType === 'object' ? charType.UUID || charType : charType;
      const char = createMockCharacteristicInstance(key);
      characteristics.set(key, char);
      service.characteristics.push(char);
      return char;
    }),
    setCharacteristic: vi.fn(function (this: any, _charType: any, _value: any) {
      return this;
    }),
    removeCharacteristic: vi.fn(),
  };

  return service;
}

/**
 * Create a mock characteristic instance with chainable methods.
 */
function createMockCharacteristicInstance(name: string) {
  const char: any = {
    UUID: name,
    displayName: name,
    value: undefined,
    props: { perms: [] },
    updateValue: vi.fn(function (this: any, val: any) {
      this.value = val;
      return this;
    }),
    setValue: vi.fn(function (this: any, val: any) {
      this.value = val;
      return this;
    }),
    setProps: vi.fn(function (this: any) {
      return this;
    }),
    on: vi.fn(function (this: any) {
      return this;
    }),
  };
  return char;
}

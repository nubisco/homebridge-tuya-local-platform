import type {
  API,
  Categories,
  Characteristic,
  CharacteristicValue,
  Logger,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge'

// Re-export homebridge types used throughout
export type { API, Categories, Characteristic, CharacteristicValue, Logger, PlatformAccessory, Service }

export interface HAPContext {
  Characteristic: typeof Characteristic
  Service: typeof Service
  Categories: any
  AdaptiveLightingController: any
  EnergyCharacteristics?: EnergyCharacteristicsMap
  UUID: { generate: (input: string) => string }
}

export interface EnergyCharacteristicsMap {
  Amperes: WithUUID<new () => Characteristic>
  KilowattHours: WithUUID<new () => Characteristic>
  KilowattVoltAmpereHour: WithUUID<new () => Characteristic>
  VoltAmperes: WithUUID<new () => Characteristic>
  Volts: WithUUID<new () => Characteristic>
  Watts: WithUUID<new () => Characteristic>
}

// DPS values are dynamic protocol data - can be boolean, number, string, or other

export type DPSValue = any
export type DPSState = Record<string, DPSValue>

export enum TuyaProtocolVersion {
  V3_1 = '3.1',
  V3_3 = '3.3',
  V3_4 = '3.4',
}

export enum TuyaCommand {
  CONTROL = 7,
  STATUS = 8,
  HEART_BEAT = 9,
  DP_QUERY = 10,
  DP_QUERY_NEW = 16,
  SESS_KEY_NEG_START = 3,
  SESS_KEY_NEG_RES = 4,
  SESS_KEY_NEG_FINISH = 5,
}

export interface TuyaDeviceConfig {
  id: string
  key: string
  ip?: string
  name?: string
  type: string
  version?: string
  fake?: boolean
  manufacturer?: string
  model?: string
  [key: string]: any
}

export interface TuyaDeviceContext extends TuyaDeviceConfig {
  UUID: string
  log: Logger
  connect: boolean
}

export interface TuyaPlatformConfig {
  platform: string
  name?: string
  devices: TuyaDeviceConfig[]
}

export type HomebridgeCallback = (err?: Error | null, value?: CharacteristicValue) => void

export interface RoomToWaterMapEntry {
  room: number
  water: number
}

export interface HSBColor {
  h: number
  s: number
  b: number
}

export interface PhaseData {
  voltage: number | undefined
  current: number | undefined
  power: number | undefined
}

export interface CircuitBreakerTelemetry {
  totalForwardEnergy: number | undefined
  leakageCurrent: number | undefined
  temperature: number | undefined
  fault: number | undefined
  switchState: boolean | undefined
  phaseData: PhaseData | undefined
}

export interface PendingCallbacks {
  props: Record<string, DPSValue>
  callbacks: HomebridgeCallback[]
  timer?: ReturnType<typeof setTimeout>
}

export interface DiscoveredDevice {
  id: string
  ip: string
  version: string
  [key: string]: unknown
}

export type AccessoryClass = {
  new (platform: any, accessory: PlatformAccessory, device: any, isNew: boolean): any
  getCategory(categories: typeof Categories): number
}

export type ClassDefMap = Record<string, AccessoryClass>

export interface ValveType {
  GENERIC_VALVE: 0
  IRRIGATION: 1
  SHOWER_HEAD: 2
  WATER_FAUCET: 3
}

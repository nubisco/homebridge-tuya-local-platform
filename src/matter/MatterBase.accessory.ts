import BaseAccessory from '../accessories/Base.accessory'
import type TuyaAccessory from '../protocol/TuyaAccessory'
import type { DPSState, DPSValue } from '../types'

export interface MatterPartDefinition {
  id: string
  displayName: string
  deviceType: unknown
  clusters: Record<string, Record<string, unknown>>
  handlers?: Record<string, Record<string, (...args: any[]) => unknown>>
}

export interface MatterAccessoryDefinition {
  deviceType: unknown
  clusters?: Record<string, Record<string, unknown>>
  handlers?: Record<string, Record<string, (...args: any[]) => unknown>>
  parts?: MatterPartDefinition[]
}

/**
 * Exposes one Tuya device over Matter, alongside its HomeKit accessory.
 *
 * The HomeKit accessory owns the LAN connection. This class only listens to the same
 * TuyaAccessory and writes to it, so a device is never connected twice.
 */
class MatterBaseAccessory {
  platform: any
  device: TuyaAccessory
  log: any
  matter: any
  UUID: string

  // The Tuya value conversions live on BaseAccessory and only read `device` and `log`,
  // so they are borrowed through a bare instance rather than duplicated here. The
  // constructor is skipped on purpose: it would register a HomeKit accessory.
  codec: BaseAccessory

  constructor(platform: any, device: TuyaAccessory, UUID: string) {
    this.platform = platform
    this.device = device
    this.log = platform.log
    this.matter = platform.api.matter
    this.UUID = UUID

    this.codec = Object.create(BaseAccessory.prototype)
    this.codec.device = device
    this.codec.log = this.log
  }

  /**
   * The Matter shape of this device. Called before the device has reported any
   * state, so initial values come from whatever is known (usually nothing).
   */
  _getDefinition(): MatterAccessoryDefinition {
    throw new Error('Not implemented')
  }

  /**
   * Pushes a device-side change (app, wall switch, schedule) to Matter.
   */
  _onDeviceChange(_changes: DPSState, _state: DPSState): void {
    // Override in subclasses
  }

  async register(pluginName: string, platformName: string): Promise<void> {
    const context = this.device.context
    const definition = this._getDefinition()

    await this.matter.registerPlatformAccessories(pluginName, platformName, [
      {
        UUID: this.UUID,
        displayName: context.name,
        serialNumber: context.id.slice(8),
        manufacturer: context.manufacturer || 'Unknown',
        model: context.model || 'Unknown',
        context: { deviceId: context.id, type: context.type },
        ...definition,
      },
    ])

    this.device.on('change', (changes: DPSState, state: DPSState) => {
      // The first 'change' after connecting carries no changes, only the full state.
      this._onDeviceChange(Object.keys(changes).length ? changes : state, state)
    })

    if (this.device.state && Object.keys(this.device.state).length)
      this._onDeviceChange(this.device.state, this.device.state)
  }

  /**
   * Sends DPs to the device. Throwing here makes Homebridge answer the controller
   * with a Matter error, and leaves the exposed state where it was.
   */
  _send(dps: DPSState): void {
    if (!this.device.connected && !this.device.context.fake)
      throw new this.matter.status.Busy(`${this.device.context.name} is not connected`)

    const changed: DPSState = {}
    for (const dp in dps) {
      if (dps.hasOwnProperty(dp) && dps[dp] !== this.device.state[dp]) changed[dp] = dps[dp]
    }
    if (!Object.keys(changed).length) return

    if (!this.device.update(changed))
      throw new this.matter.status.Failure(`Failed to update ${this.device.context.name}`)
  }

  _update(cluster: string, attributes: Record<string, unknown>, partId?: string): void {
    this.matter.updateAccessoryState(this.UUID, cluster, attributes, partId).catch((err: any) => {
      this.log.debug(
        'Failed to update Matter state of %s (%s): %s',
        this.device.context.name,
        cluster,
        err && err.message ? err.message : err,
      )
    })
  }

  _coerceOnOff(value: DPSValue | undefined): boolean {
    return this.codec._coerceBoolean(value, false)
  }

  // Matter levels run 1 to 254 for lights. The Tuya conversions speak HomeKit's 0 to
  // 100, so levels go through a percentage on the way in and out.
  _levelToPercent(level: number): number {
    return Math.min(100, Math.max(1, Math.round((Number(level) * 100) / 254)))
  }

  _percentToLevel(percent: number): number {
    return Math.min(254, Math.max(1, Math.round((Number(percent) * 254) / 100)))
  }
}

export default MatterBaseAccessory

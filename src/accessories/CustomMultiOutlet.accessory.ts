import BaseAccessory from './Base.accessory'
import async from 'async'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

interface PendingPower {
  props: DPSState
  callbacks: HomebridgeCallback[]
  timer?: ReturnType<typeof setTimeout>
}

class CustomMultiOutletAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.OUTLET
  }

  private _justRegistered?: boolean
  private _pendingPower: PendingPower | null = null

  constructor(...props: any[]) {
    super(...props)
  }

  _registerPlatformAccessory(): void {
    this._verifyCachedPlatformAccessory()
    this._justRegistered = true

    super._registerPlatformAccessory()
  }

  _verifyCachedPlatformAccessory(): void {
    if (this._justRegistered) return

    const { Service } = this.hap

    if (!Array.isArray(this.device.context.outlets)) {
      throw new Error('The outlets definition is missing or is malformed: ' + this.device.context.outlets)
    }
    const _validServices: any[] = []
    this.device.context.outlets.forEach((outlet: any, _i: number) => {
      if (!outlet || !outlet.hasOwnProperty('name') || !outlet.hasOwnProperty('dp') || !isFinite(outlet.dp))
        throw new Error('The outlet definition #${i} is missing or is malformed: ' + outlet)

      const name = ((outlet.name || '').trim() || 'Unnamed') + ' - ' + this.device.context.name
      let service = this.accessory.getServiceByUUIDAndSubType(Service.Outlet, 'outlet ' + outlet.dp)
      if (service) this._checkServiceName(service, name)
      else service = this.accessory.addService(Service.Outlet, name, 'outlet ' + outlet.dp)

      _validServices.push(service)
    })

    this.accessory.services
      .filter((service: any) => service.UUID === Service.Outlet.UUID && !_validServices.includes(service))
      .forEach((service: any) => {
        this.accessory.removeService(service)
      })
  }

  _registerCharacteristics(dps: DPSState): void {
    this._verifyCachedPlatformAccessory()

    const { Service, Characteristic } = this.hap

    const characteristics: Record<string, any> = {}
    this.accessory.services.forEach((service: any) => {
      if (service.UUID !== Service.Outlet.UUID || !service.subtype) return false

      let match: RegExpMatchArray | null
      if ((match = service.subtype.match(/^outlet (\d+)$/)) === null) return

      characteristics[match[1]] = service
        .getCharacteristic(Characteristic.On)
        .updateValue(dps[match[1]])
        .on('get', this.getPower.bind(this, match[1]))
        .on('set', this.setPower.bind(this, match[1]))
    })

    this.device.on('change', (changes: DPSState, _state: DPSState) => {
      Object.keys(changes).forEach((key) => {
        if (characteristics[key] && characteristics[key].value !== changes[key])
          characteristics[key].updateValue(changes[key])
      })
    })
  }

  getPower(dp: string, callback: HomebridgeCallback): void {
    callback(null, this.device.state[dp])
  }

  setPower(dp?: string, value?: DPSValue, callback?: HomebridgeCallback): void {
    if (!this._pendingPower) {
      this._pendingPower = { props: {}, callbacks: [] }
    }

    if (dp) {
      if (this._pendingPower.timer) clearTimeout(this._pendingPower.timer)

      this._pendingPower.props = { ...this._pendingPower.props, ...{ [dp]: value! } }
      this._pendingPower.callbacks.push(callback!)

      this._pendingPower.timer = setTimeout(() => {
        this.setPower()
      }, 500)
      return
    }

    const callbacks = this._pendingPower.callbacks
    const callEachBack = (err: Error | null) => {
      async.eachSeries(callbacks, (callback: HomebridgeCallback, next: () => void) => {
        try {
          callback(err)
        } catch (_ex) {
          /* ignore */
        }
        next()
      })
    }

    const newValue = this._pendingPower.props
    this._pendingPower = null

    this.setMultiState(newValue, callEachBack)
  }
}

export default CustomMultiOutletAccessory

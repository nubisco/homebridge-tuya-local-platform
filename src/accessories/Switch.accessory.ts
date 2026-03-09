import BaseAccessory from './Base.accessory'
import async from 'async'
import type { DPSState, DPSValue, HomebridgeCallback } from '../types'

interface PendingPower {
  props: DPSState
  callbacks: HomebridgeCallback[]
  timer?: ReturnType<typeof setTimeout>
}

class SwitchAccessory extends BaseAccessory {
  static getCategory(Categories: any): number {
    return Categories.SWITCH
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

    const switchCount = parseInt(this.device.context.switchCount) || 1
    const _validServices: any[] = []
    for (let i = 0; i++ < switchCount; ) {
      let service = this.accessory.getServiceByUUIDAndSubType(Service.Switch, 'switch ' + i)
      if (service) this._checkServiceName(service, this.device.context.name + ' ' + i)
      else service = this.accessory.addService(Service.Switch, this.device.context.name + ' ' + i, 'switch ' + i)

      _validServices.push(service)
    }

    this.accessory.services
      .filter((service: any) => service.UUID === Service.Switch.UUID && !_validServices.includes(service))
      .forEach((service: any) => {
        this.log.info('Removing', service.displayName)
        this.accessory.removeService(service)
      })
  }

  _registerCharacteristics(dps: DPSState): void {
    this._verifyCachedPlatformAccessory()

    const { Service, Characteristic } = this.hap

    const characteristics: Record<string, any> = {}
    this.accessory.services.forEach((service: any) => {
      if (service.UUID !== Service.Switch.UUID || !service.subtype) return false

      let match: RegExpMatchArray | null
      if ((match = service.subtype.match(/^switch (\d+)$/)) === null) return

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

export default SwitchAccessory

import MatterBaseAccessory from './MatterBase.accessory'
import type { MatterAccessoryDefinition } from './MatterBase.accessory'
import type { DPSState } from '../types'

interface OnOffChannel {
  partId?: string
  name: string
  dp: string
}

/**
 * Anything that is only switched on and off: plain lights, outlets, and single or
 * multi-gang switches and power strips. A device with more than one channel becomes a
 * composed device with one part per channel, the way HomeKit gets one service each.
 */
class OnOffMatterAccessory extends MatterBaseAccessory {
  channels: OnOffChannel[] = []

  _getChannels(): OnOffChannel[] {
    const context = this.device.context
    const type = (context.type || '').toLowerCase()

    if (type === 'switch' || type === 'multioutlet') {
      const count = parseInt(type === 'switch' ? context.switchCount : context.outletCount) || 1
      if (count === 1) return [{ name: context.name, dp: '1' }]

      const prefix = type === 'switch' ? 'switch' : 'outlet'
      return Array.from({ length: count }, (_value, i) => ({
        partId: `${prefix}-${i + 1}`,
        name: `${context.name} ${i + 1}`,
        dp: String(i + 1),
      }))
    }

    if (type === 'custommultioutlet') {
      if (!Array.isArray(context.outlets))
        throw new Error('The outlets definition is missing or is malformed: ' + context.outlets)

      return context.outlets
        .filter((outlet: any) => outlet && outlet.hasOwnProperty('dp') && isFinite(outlet.dp))
        .map((outlet: any) => ({
          partId: `outlet-${outlet.dp}`,
          name: ((outlet.name || '').trim() || 'Unnamed') + ' - ' + context.name,
          dp: String(outlet.dp),
        }))
    }

    return [{ name: context.name, dp: this.codec._getCustomDP(context.dpPower) || '1' }]
  }

  _getChannelDeviceType(): unknown {
    const { deviceTypes } = this.matter
    switch ((this.device.context.type || '').toLowerCase()) {
      case 'simplelight':
        return deviceTypes.OnOffLight
      case 'switch':
        return deviceTypes.OnOffSwitch
      default:
        return deviceTypes.OnOffOutlet
    }
  }

  _getDefinition(): MatterAccessoryDefinition {
    this.channels = this._getChannels()
    const deviceType = this._getChannelDeviceType()

    const handlersFor = (channel: OnOffChannel) => ({
      onOff: {
        on: () => this._send({ [channel.dp]: true }),
        off: () => this._send({ [channel.dp]: false }),
        toggle: () => this._send({ [channel.dp]: !this._coerceOnOff(this.device.state[channel.dp]) }),
      },
    })
    const clustersFor = (channel: OnOffChannel) => ({
      onOff: { onOff: this._coerceOnOff(this.device.state[channel.dp]) },
    })

    if (this.channels.length === 1 && !this.channels[0].partId) {
      return { deviceType, clusters: clustersFor(this.channels[0]), handlers: handlersFor(this.channels[0]) }
    }

    return {
      deviceType: this.matter.deviceTypes.BridgedNode,
      parts: this.channels.map((channel) => ({
        id: channel.partId,
        displayName: channel.name,
        deviceType,
        clusters: clustersFor(channel),
        handlers: handlersFor(channel),
      })),
    }
  }

  _onDeviceChange(changes: DPSState): void {
    this.channels.forEach((channel) => {
      if (!changes.hasOwnProperty(channel.dp)) return
      this._update('onOff', { onOff: this._coerceOnOff(changes[channel.dp]) }, channel.partId)
    })
  }
}

export default OnOffMatterAccessory

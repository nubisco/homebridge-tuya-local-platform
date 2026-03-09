import dgram from 'dgram'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import type { Logger } from 'homebridge'
import type { DiscoveredDevice } from '../types'

const UDP_KEY = Buffer.from('6c1ec8e2bb9bb59ab50b0daf649b410a', 'hex')

interface DiscoveryOptions {
  log: Logger
  ids?: string[]
  clear?: boolean
}

class TuyaDiscovery extends EventEmitter {
  discovered: Map<string, string> = new Map()
  limitedIds: string[] = []
  log!: Logger

  private _servers: Record<number, dgram.Socket | null> = {}
  private _running = false

  constructor() {
    super()
  }

  start(props: DiscoveryOptions): this {
    this.log = props.log

    if (props.clear) {
      this.removeAllListeners()
      this.discovered.clear()
    }

    this.limitedIds.splice(0)
    if (Array.isArray(props.ids)) [].push.apply(this.limitedIds, props.ids)

    this._running = true
    this._start(6666)
    this._start(6667)

    return this
  }

  stop(): this {
    this._running = false
    this._stop(6666)
    this._stop(6667)

    return this
  }

  end(): this {
    this.stop()
    process.nextTick(() => {
      this.removeAllListeners()
      this.discovered.clear()
      this.log.info('Discovery ended.')
      this.emit('end')
    })

    return this
  }

  private _start(port: number): void {
    this._stop(port)

    const server = (this._servers[port] = dgram.createSocket({ type: 'udp4', reuseAddr: true }))
    server.on('error', this._onDgramError.bind(this, port))
    server.on('close', this._onDgramClose.bind(this, port))
    server.on('message', this._onDgramMessage.bind(this, port))

    server.bind(port, () => {
      this.log.info(`Discovery - Discovery started on port ${port}.`)
    })
  }

  private _stop(port: number): void {
    if (this._servers[port]) {
      this._servers[port]!.removeAllListeners()
      this._servers[port]!.close()
      this._servers[port] = null
    }
  }

  private _onDgramError(port: number, err: NodeJS.ErrnoException): void {
    this._stop(port)

    if (err && err.code === 'EADDRINUSE') {
      this.log.warn(`Discovery - Port ${port} is in use. Will retry in 15 seconds.`)

      setTimeout(() => {
        this._start(port)
      }, 15000)
    } else {
      this.log.error(`Discovery - Port ${port} failed:\n${err.stack}`)
    }
  }

  private _onDgramClose(port: number): void {
    this._stop(port)

    this.log.info(`Discovery - Port ${port} closed.${this._running ? ' Restarting...' : ''}`)
    if (this._running)
      setTimeout(() => {
        this._start(port)
      }, 1000)
  }

  private _onDgramMessage(port: number, msg: Buffer, info: dgram.RemoteInfo): void {
    const len = msg.length
    if (len < 16 || msg.readUInt32BE(0) !== 0x000055aa || msg.readUInt32BE(len - 4) !== 0x0000aa55) {
      this.log.error(`Discovery - UDP from ${info.address}:${port}`, msg.toString('hex'))
      return
    }

    const size = msg.readUInt32BE(12)
    if (len - size < 8) {
      this.log.error(`Discovery - UDP from ${info.address}:${port} size ${len - size}`)
      return
    }

    const cleanMsg = msg.slice(len - size + 4, len - 8)

    let decryptedMsg: string | undefined
    if (port === 6667) {
      try {
        const decipher = crypto.createDecipheriv('aes-128-ecb', UDP_KEY, '')
        decryptedMsg = decipher.update(cleanMsg, undefined, 'utf8')
        decryptedMsg += decipher.final('utf8')
      } catch (_ex) {
        // Encrypted broadcast could not be decrypted — device may already
        // have been discovered on port 6666.  Silently ignore.
        return
      }
    }

    if (!decryptedMsg) decryptedMsg = cleanMsg.toString('utf8')

    try {
      const result = JSON.parse(decryptedMsg)
      if (result && result.gwId && result.ip) this._onDiscover(result)
      else this.log.error(`Discovery - UDP from ${info.address}:${port} decrypted`, cleanMsg.toString('hex'))
    } catch (_ex) {
      this.log.error(`Discovery - Failed to parse discovery response on port ${port}: ${decryptedMsg}`)
      this.log.error(`Discovery - Failed to parse discovery raw message on port ${port}: ${msg.toString('hex')}`)
    }
  }

  private _onDiscover(data: Record<string, unknown> & { gwId: string; ip: string }): void {
    if (this.discovered.has(data.gwId)) return
    ;(data as unknown as DiscoveredDevice).id = data.gwId
    delete (data as Record<string, unknown>).gwId

    this.discovered.set((data as unknown as DiscoveredDevice).id, data.ip)

    this.emit('discover', data)

    if (
      this.limitedIds.length &&
      this.limitedIds.includes((data as unknown as DiscoveredDevice).id) &&
      this.limitedIds.length <= this.discovered.size &&
      this.limitedIds.every((id) => this.discovered.has(id))
    ) {
      process.nextTick(() => {
        this.end()
      })
    }
  }
}

export default new TuyaDiscovery()

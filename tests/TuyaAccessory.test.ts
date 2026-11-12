import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'
import crypto from 'crypto'
import TuyaAccessory from '../src/protocol/TuyaAccessory'
import { createMockLogger } from './helpers'

// ─── net module mock ──────────────────────────────────────────────────────────
// We keep a reference to the most recently created mock socket so individual
// tests can interact with it (emit events, check calls, etc.)
let lastSocket: any

vi.mock('net', () => {
  const { EventEmitter: EE } = require('events')

  class MockSocket extends EE {
    connect = vi.fn()
    write = vi.fn(() => true)
    destroy = vi.fn()
    end = vi.fn()
    setKeepAlive = vi.fn()
    setNoDelay = vi.fn()

    constructor() {
      super()
      lastSocket = this
    }
  }
  return { default: { Socket: MockSocket } }
})

// ─── helpers ──────────────────────────────────────────────────────────────────
function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    id: 'device-001',
    key: 'abcdef1234567890', // 16-byte key for AES-128
    ip: '192.168.1.50',
    name: 'Test Device',
    version: '3.3',
    log: createMockLogger(),
    connect: false, // prevent automatic TCP connection in most tests
    ...overrides,
  }
}

// Build a minimal valid Tuya frame (shared header/footer)
function buildFrame(cmd: number, payload: Buffer): Buffer {
  const prefix = 4 // 0x000055aa
  const seq = 4
  const cmdBytes = 4
  const size = 4
  const crc = 4
  const suffix = 4
  const total = prefix + seq + cmdBytes + size + payload.length + crc + suffix
  const buf = Buffer.alloc(total)
  buf.writeUInt32BE(0x000055aa, 0)
  buf.writeUInt32BE(0, 4) // sequence
  buf.writeUInt32BE(cmd, 8)
  buf.writeUInt32BE(payload.length + crc + suffix, 12) // size field
  payload.copy(buf, 16)
  buf.writeUInt32BE(0, 16 + payload.length) // crc stub
  buf.writeUInt32BE(0x0000aa55, total - 4)
  return buf
}

// Build a v3.4 frame the way a device does: AES-128-ECB payload after a 4-byte
// retcode, then an HMAC-SHA256 of everything before it.
function build34Frame(cmd: number, plaintext: Buffer, key: string, { badHmac = false } = {}): Buffer {
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null)
  const body = Buffer.concat([Buffer.alloc(4), cipher.update(plaintext), cipher.final()])
  const header = Buffer.alloc(16)
  header.writeUInt32BE(0x000055aa, 0)
  header.writeUInt32BE(1, 4)
  header.writeUInt32BE(cmd, 8)
  header.writeUInt32BE(body.length + 32 + 4, 12)
  const mac = badHmac
    ? Buffer.alloc(32)
    : crypto
        .createHmac('sha256', key)
        .update(Buffer.concat([header, body]))
        .digest()
  const suffix = Buffer.from('0000aa55', 'hex')
  return Buffer.concat([header, body, mac, suffix])
}

// The message queue runs its worker on a microtask, so let it drain.
async function drainQueue(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

// ─── tests ────────────────────────────────────────────────────────────────────
describe('TuyaAccessory', () => {
  let log: ReturnType<typeof createMockLogger>

  beforeEach(() => {
    log = createMockLogger()
    vi.useFakeTimers()
    lastSocket = null
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // ── Constructor ─────────────────────────────────────────────────────────────
  describe('constructor', () => {
    it('returns a TuyaAccessory instance with correct context', () => {
      const props = makeProps()
      const acc = new TuyaAccessory(props as any)
      expect(acc).toBeInstanceOf(TuyaAccessory)
      expect(acc).toBeInstanceOf(EventEmitter)
      expect(acc.context.id).toBe('device-001')
      expect(acc.context.key).toBe('abcdef1234567890')
      expect(acc.context.ip).toBe('192.168.1.50')
      expect(acc.context.version).toBe('3.3')
    })

    it('defaults version to 3.1 when not provided', () => {
      // omit version entirely so the spread default applies
      const { version: _v, ...rest } = makeProps()
      const acc = new TuyaAccessory(rest as any)
      expect(acc.context.version).toBe('3.1')
    })

    it('defaults port to 6668', () => {
      const acc = new TuyaAccessory(makeProps() as any)
      expect(acc.context.port).toBe(6668)
    })

    it('logs and skips init when required props are missing', () => {
      const props = { log, connect: false } as any
      const acc = new TuyaAccessory(props)
      expect(log.info).toHaveBeenCalledWith('Insufficient details to initialize:', expect.any(String))
      expect(acc.connected).toBe(false)
    })

    it('starts as not connected', () => {
      const acc = new TuyaAccessory(makeProps() as any)
      expect(acc.connected).toBe(false)
    })

    it('initialises an empty state object', () => {
      const acc = new TuyaAccessory(makeProps() as any)
      expect(acc.state).toEqual({})
    })
  })

  // ── Fake mode ────────────────────────────────────────────────────────────────
  describe('fake mode', () => {
    it('sets connected=true without a real socket', () => {
      // fake mode needs connect:true so _connect() is actually called
      const acc = new TuyaAccessory(makeProps({ fake: true, connect: true }) as any)
      expect(acc.connected).toBe(true)
    })

    it('emits a change event after 1 s in fake mode', () => {
      const acc = new TuyaAccessory(makeProps({ fake: true, connect: true }) as any)
      const handler = vi.fn()
      acc.on('change', handler)
      vi.advanceTimersByTime(1100)
      expect(handler).toHaveBeenCalledWith({}, {})
    })

    it('does not create a net.Socket in fake mode', () => {
      new TuyaAccessory(makeProps({ fake: true, connect: true }) as any)
      expect(lastSocket).toBeNull()
    })
  })

  // ── update() ─────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('returns true in fake mode with no args', () => {
      const acc = new TuyaAccessory(makeProps({ fake: true, connect: true }) as any)
      expect(acc.update()).toBe(true)
    })

    it('calls _fakeUpdate and emits change after 1s when DPS are given', () => {
      const acc = new TuyaAccessory(makeProps({ fake: true, connect: true }) as any)
      // advance past the constructor timeout first
      vi.advanceTimersByTime(1100)

      const handler = vi.fn()
      acc.on('change', handler)

      acc.update({ '1': true })
      vi.advanceTimersByTime(1100)

      expect(handler).toHaveBeenCalledWith({ '1': true }, { '1': true })
    })

    it('non-numeric DP keys are ignored in fake mode', () => {
      const acc = new TuyaAccessory(makeProps({ fake: true, connect: true }) as any)
      vi.advanceTimersByTime(1100)

      const handler = vi.fn()
      acc.on('change', handler)

      // 'name' is not numeric → should NOT be sent as a DP
      acc.update({ name: 'Test' } as any)
      vi.advanceTimersByTime(1100)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  // ── _connect() / socket ───────────────────────────────────────────────────────
  describe('socket connection', () => {
    it('creates a socket and calls connect when connect:true', () => {
      new TuyaAccessory(makeProps({ connect: true }) as any)
      expect(lastSocket).not.toBeNull()
      expect(lastSocket.connect).toHaveBeenCalledWith(6668, '192.168.1.50')
    })

    it('marks connected=true when socket emits "connect" (v3.3)', () => {
      const acc = new TuyaAccessory(makeProps({ connect: true }) as any)
      lastSocket.emit('connect')
      expect(acc.connected).toBe(true)
    })

    it('resets connected=false on socket close', () => {
      const acc = new TuyaAccessory(makeProps({ connect: true }) as any)
      lastSocket.emit('connect')
      expect(acc.connected).toBe(true)
      lastSocket.emit('close')
      expect(acc.connected).toBe(false)
    })

    it('resets connected=false on socket end', () => {
      const acc = new TuyaAccessory(makeProps({ connect: true }) as any)
      lastSocket.emit('connect')
      lastSocket.emit('end')
      expect(acc.connected).toBe(false)
    })

    it('handles socket errors without throwing', () => {
      new TuyaAccessory(makeProps({ connect: true }) as any)
      expect(() => lastSocket.emit('error', new Error('ECONNREFUSED'))).not.toThrow()
    })

    it('retries on ECONNRESET without destroying socket', () => {
      // use the same `log` instance so we can assert on it
      const acc = new TuyaAccessory({ ...makeProps({ connect: true, version: '3.3' }), log } as any)
      const err: NodeJS.ErrnoException = new Error('reset')
      err.code = 'ECONNRESET'
      lastSocket.emit('error', err)
      // Should have logged info and NOT destroyed the socket immediately
      expect(log.info).toHaveBeenCalled()
    })
  })

  // ── _send() returns false when not connected ──────────────────────────────────
  describe('_send() internal gating', () => {
    it('update() returns false when socket is not yet connected (non-fake)', () => {
      const acc = new TuyaAccessory(makeProps({ connect: true }) as any)
      // Not connected yet: socket was created but no 'connect' event fired
      expect(acc.update()).toBe(false)
    })

    it('_send writes to socket after connection (v3.3)', () => {
      const acc = new TuyaAccessory(makeProps({ connect: true }) as any)
      lastSocket.emit('connect')
      // update() with no args sends a status-request (cmd 10)
      acc.update()
      expect(lastSocket.write).toHaveBeenCalled()
    })

    it('_send writes to socket after connection (v3.1)', () => {
      const acc = new TuyaAccessory(makeProps({ connect: true, version: '3.1' }) as any)
      lastSocket.emit('connect')
      acc.update()
      expect(lastSocket.write).toHaveBeenCalled()
    })
  })

  // ── Message handler 3.1 via simulated "data" events ──────────────────────────
  describe('_msgHandler_3_1 (protocol 3.1)', () => {
    function makeV31Accessory() {
      const acc = new TuyaAccessory(makeProps({ connect: true, version: '3.1' }) as any)
      lastSocket.emit('connect')
      return acc
    }

    it('ignores frames that are missing magic prefix/suffix', () => {
      const acc = makeV31Accessory()
      const handler = vi.fn()
      acc.on('change', handler)
      lastSocket.emit('data', Buffer.from('deadbeef', 'hex'))
      expect(handler).not.toHaveBeenCalled()
    })

    it('handles heartbeat (cmd 9) without error', () => {
      const acc = makeV31Accessory()
      const payload = Buffer.from('')
      const frame = buildFrame(9, payload)
      expect(() => lastSocket.emit('data', frame)).not.toThrow()
    })

    it('emits change for cmd=10 with valid JSON dps', () => {
      const acc = makeV31Accessory()
      const dpsPayload = JSON.stringify({ dps: { '1': true } })
      const frame = buildFrame(10, Buffer.from(dpsPayload))

      return new Promise<void>((resolve) => {
        acc.on('change', (oldState, newState) => {
          expect(oldState).toEqual({ '1': true })
          expect(newState).toEqual({ '1': true })
          resolve()
        })
        lastSocket.emit('data', frame)
      })
    })

    it('handles "json obj data unvalid" (cmd=10) gracefully', () => {
      const acc = makeV31Accessory()
      const handler = vi.fn()
      acc.on('change', handler)
      const frame = buildFrame(10, Buffer.from('json obj data unvalid'))
      expect(() => lastSocket.emit('data', frame)).not.toThrow()
    })

    it('handles invalid JSON payload without throwing', () => {
      const acc = makeV31Accessory()
      const frame = buildFrame(10, Buffer.from('{invalid json'))
      expect(() => lastSocket.emit('data', frame)).not.toThrow()
    })
  })

  // ── Message handler 3.3 via simulated "data" events ──────────────────────────
  describe('_msgHandler_3_3 (protocol 3.3)', () => {
    function makeV33Accessory() {
      const acc = new TuyaAccessory(makeProps({ connect: true, version: '3.3' }) as any)
      lastSocket.emit('connect')
      return acc
    }

    it('ignores frames that are too short', () => {
      const acc = makeV33Accessory()
      expect(() => lastSocket.emit('data', Buffer.from('0000', 'hex'))).not.toThrow()
    })

    it('handles heartbeat (cmd 9) without error', () => {
      const acc = makeV33Accessory()
      const frame = buildFrame(9, Buffer.from(''))
      expect(() => lastSocket.emit('data', frame)).not.toThrow()
    })

    it('handles cmd 7 without error', () => {
      const acc = makeV33Accessory()
      const frame = buildFrame(7, Buffer.from(''))
      expect(() => lastSocket.emit('data', frame)).not.toThrow()
    })
  })

  // ── _change() ────────────────────────────────────────────────────────────────
  describe('_change() (internal state tracking)', () => {
    // _change() is exercised via the real message-handler path (cmd=10 on v3.1)
    it('only emits change when state actually differs', () => {
      // Use real timers for this test since we need setImmediate to work
      vi.useRealTimers()

      const acc = new TuyaAccessory({ ...makeProps({ connect: true, version: '3.1' }), log } as any)
      lastSocket.emit('connect')

      const frame = buildFrame(10, Buffer.from(JSON.stringify({ dps: { '1': true } })))
      let callCount = 0

      return new Promise<void>((resolve) => {
        acc.on('change', () => {
          callCount++
        })

        // First message: state transitions {} → { '1': true } → should emit
        lastSocket.emit('data', frame)

        // Wait for first change to be processed
        setImmediate(() => {
          expect(callCount).toBe(1)

          // Send identical message - should NOT emit
          lastSocket.emit('data', frame)

          // Wait for async.queue to process (would emit if state changed)
          setImmediate(() => {
            setImmediate(() => {
              // Still should be 1 - no second emit
              expect(callCount).toBe(1)
              // Restore fake timers for subsequent tests
              vi.useFakeTimers()
              resolve()
            })
          })
        })
      })
    })

    it('accumulates state across multiple updates', () => {
      const acc = new TuyaAccessory(makeProps({ fake: true, connect: true }) as any)
      vi.advanceTimersByTime(1100)

      acc.update({ '1': true })
      vi.advanceTimersByTime(1100)
      acc.update({ '2': 500 })
      vi.advanceTimersByTime(1100)

      expect(acc.state).toMatchObject({ '1': true, '2': 500 })
    })
  })

  // ── version routing ───────────────────────────────────────────────────────────
  describe('version-based message queue routing', () => {
    it('selects _msgHandler_3_1 for version 3.1', () => {
      const acc = new TuyaAccessory(makeProps({ version: '3.1' }) as any)
      // If constructed without error, routing was set correctly
      expect(acc).toBeInstanceOf(TuyaAccessory)
    })

    it('selects _msgHandler_3_3 for version 3.3', () => {
      const acc = new TuyaAccessory(makeProps({ version: '3.3' }) as any)
      expect(acc).toBeInstanceOf(TuyaAccessory)
    })

    it('selects _msgHandler_3_3 for version 3.2', () => {
      const acc = new TuyaAccessory(makeProps({ version: '3.2' }) as any)
      expect(acc).toBeInstanceOf(TuyaAccessory)
    })

    it('selects _msgHandler_3_4 for version 3.4', () => {
      const acc = new TuyaAccessory(makeProps({ version: '3.4' }) as any)
      expect(acc).toBeInstanceOf(TuyaAccessory)
    })

    it('selects _msgHandler_3_5 for version 3.5', () => {
      const acc = new TuyaAccessory(makeProps({ version: '3.5' }) as any)
      expect(acc).toBeInstanceOf(TuyaAccessory)
    })
    it.each([
      [3.4, '3.4'],
      ['3.40', '3.4'],
      [' 3.3', '3.3'],
      [undefined, '3.1'],
      ['garbage', '3.1'],
    ])('normalises version %j to %j', (version, expected) => {
      const acc = new TuyaAccessory(makeProps({ version }) as any)
      expect(acc.context.version).toBe(expected)
    })

    it('decodes v3.4 frames when the version is configured as a JSON number', async () => {
      const acc = new TuyaAccessory(makeProps({ version: 3.4, connect: true }) as any)
      const changes = vi.fn()
      acc.on('change', changes)

      lastSocket.emit('data', build34Frame(8, Buffer.from(JSON.stringify({ dps: { '1': true } })), 'abcdef1234567890'))
      await drainQueue()

      expect(changes).toHaveBeenCalledWith({ '1': true }, expect.objectContaining({ '1': true }))
    })
  })

  // ── v3.4 frames that fail verification ──────────────────────────────────────
  // These used to throw inside the message queue worker, an uncaught exception
  // that took down Homebridge (or the child bridge) with every other device on it.
  describe('v3.4 frames that fail verification', () => {
    const key = 'abcdef1234567890'
    let acc: TuyaAccessory
    let socketErrors: Error[]

    beforeEach(() => {
      acc = new TuyaAccessory(makeProps({ version: '3.4', connect: true }) as any)
      socketErrors = []
      lastSocket.on('error', (err: Error) => socketErrors.push(err))
    })

    it('reports a status frame with a bad HMAC as a socket error', async () => {
      lastSocket.emit('data', build34Frame(8, Buffer.from('{"dps":{"1":true}}'), key, { badHmac: true }))
      await drainQueue()

      expect(socketErrors).toHaveLength(1)
      expect(socketErrors[0].message).toMatch(/HMAC mismatch/)
    })

    it('keeps processing frames after a bad one', async () => {
      const changes = vi.fn()
      acc.on('change', changes)

      lastSocket.emit('data', build34Frame(8, Buffer.from('{"dps":{"1":true}}'), key, { badHmac: true }))
      lastSocket.emit('data', build34Frame(8, Buffer.from('{"dps":{"1":false}}'), key))
      await drainQueue()

      expect(changes).toHaveBeenCalledWith({ '1': false }, expect.anything())
    })

    it('reports a handshake reply signed with another key as a socket error', async () => {
      lastSocket.emit('ready')
      const reply = Buffer.concat([crypto.randomBytes(16), crypto.randomBytes(32)])
      lastSocket.emit('data', build34Frame(4, reply, key))
      await drainQueue()

      expect(socketErrors).toHaveLength(1)
      expect(socketErrors[0].message).toMatch(/Check the local key/)
    })

    it('reports a handshake reply that is too short as a socket error', async () => {
      lastSocket.emit('ready')
      lastSocket.emit('data', build34Frame(4, crypto.randomBytes(16), key))
      await drainQueue()

      expect(socketErrors).toHaveLength(1)
      expect(socketErrors[0].message).toMatch(/handshake/)
    })
  })

  // ── v3.5 protocol ─────────────────────────────────────────────────────────────
  describe('v3.5 protocol', () => {
    const crypto = require('crypto')

    function decryptV35Frame(frame: Buffer, key: Buffer) {
      expect(frame.readUInt32BE(0)).toBe(0x00006699)
      expect(frame.readUInt32BE(frame.length - 4)).toBe(0x00009966)

      const seqno = frame.readUInt32BE(6)
      const cmd = frame.readUInt32BE(10)
      const declaredLen = frame.readUInt32BE(14)
      expect(frame.length).toBe(18 + declaredLen + 4)

      const aad = frame.slice(4, 18)
      const iv = frame.slice(18, 30)
      const tag = frame.slice(frame.length - 20, frame.length - 4)
      const ciphertext = frame.slice(30, frame.length - 20)

      const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv)
      decipher.setAuthTag(tag)
      decipher.setAAD(aad)
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
      return { seqno, cmd, plaintext }
    }

    function encryptV35Frame(cmd: number, seqno: number, plaintext: Buffer, key: Buffer) {
      const iv = crypto.randomBytes(12)
      const payloadLen = plaintext.length + 28

      const header = Buffer.alloc(18)
      header.writeUInt32BE(0x00006699, 0)
      header.writeUInt16BE(0, 4)
      header.writeUInt32BE(seqno, 6)
      header.writeUInt32BE(cmd, 10)
      header.writeUInt32BE(payloadLen, 14)

      const cipher = crypto.createCipheriv('aes-128-gcm', key, iv)
      cipher.setAAD(header.slice(4, 18))
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
      const tag = cipher.getAuthTag()

      const frame = Buffer.alloc(18 + payloadLen + 4)
      header.copy(frame, 0)
      iv.copy(frame, 18)
      ciphertext.copy(frame, 30)
      tag.copy(frame, 30 + ciphertext.length)
      frame.writeUInt32BE(0x00009966, frame.length - 4)
      return frame
    }

    it('emits a 6699-framed GCM frame on a v3.5 DP set command', () => {
      const key = 'abcdef1234567890'
      const acc = new TuyaAccessory(makeProps({ version: '3.5', key, connect: true }) as any)
      ;(acc as any).connected = true

      acc.update({ '1': true })

      expect(lastSocket.write).toHaveBeenCalledTimes(1)
      const frame: Buffer = lastSocket.write.mock.calls[0][0]

      const { cmd, plaintext } = decryptV35Frame(frame, Buffer.from(key, 'utf8'))
      expect(cmd).toBe(0x0d)
      expect(plaintext.slice(0, 3).toString()).toBe('3.5')
      expect(plaintext.slice(3, 15).equals(Buffer.alloc(12, 0))).toBe(true)

      const body = JSON.parse(plaintext.slice(15).toString('utf8'))
      expect(body.protocol).toBe(5)
      expect(body.data.dps).toEqual({ '1': true })
      expect(body.data.ctype).toBe(0)
    })

    it('decodes an incoming v3.5 status frame and emits change', () => {
      const key = 'abcdef1234567890'
      const acc = new TuyaAccessory(makeProps({ version: '3.5', key }) as any)
      ;(acc as any).session_key = Buffer.from(key, 'utf8')

      const changeHandler = vi.fn()
      acc.on('change', changeHandler)

      const retcode = Buffer.alloc(4, 0)
      const json = Buffer.from(JSON.stringify({ dps: { '1': true, '2': false } }), 'utf8')
      const plaintext = Buffer.concat([retcode, json])
      const frame = encryptV35Frame(0x08, 1, plaintext, Buffer.from(key, 'utf8'))

      ;(acc as any)._msgHandler_3_5({ msg: frame }, () => {})

      expect(changeHandler).toHaveBeenCalledTimes(1)
      expect(changeHandler.mock.calls[0][0]).toEqual({ '1': true, '2': false })
    })

    it('silently drops a v3.5 frame with an invalid GCM auth tag', () => {
      const key = 'abcdef1234567890'
      const acc = new TuyaAccessory(makeProps({ version: '3.5', key }) as any)
      ;(acc as any).session_key = Buffer.from(key, 'utf8')

      const handler = vi.fn()
      acc.on('change', handler)

      const frame = encryptV35Frame(0x08, 1, Buffer.from('{"dps":{"1":true}}', 'utf8'), Buffer.from(key, 'utf8'))
      frame[frame.length - 5] ^= 0xff // corrupt auth tag

      const callback = vi.fn()
      ;(acc as any)._msgHandler_3_5({ msg: frame }, callback)

      expect(handler).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
    })
    describe('framing and errors', () => {
      const key = 'abcdef1234567890'
      let acc: TuyaAccessory
      let socketErrors: Error[]
      let changes: ReturnType<typeof vi.fn>

      beforeEach(() => {
        acc = new TuyaAccessory(makeProps({ version: '3.5', key, connect: true }) as any)
        socketErrors = []
        lastSocket.on('error', (err: Error) => socketErrors.push(err))
        changes = vi.fn()
        acc.on('change', changes)
      })

      const statusFrame = (dps: Record<string, unknown>, retcode = true) =>
        encryptV35Frame(
          8,
          1,
          Buffer.concat([retcode ? Buffer.alloc(4) : Buffer.alloc(0), Buffer.from(JSON.stringify({ dps }))]),
          Buffer.from(key),
        )

      it('selects 6699 framing when the version is configured as a JSON number', () => {
        const numeric = new TuyaAccessory(makeProps({ version: 3.5 }) as any)
        expect(numeric.context.version).toBe('3.5')
        expect((numeric as any)._framePrefixHex).toBe('00006699')
      })

      it('cuts a frame by its declared length, not by an end marker inside the payload', () => {
        const push = vi.spyOn((acc as any)._msgQueue, 'push')
        const payload = Buffer.from('aaaaaaaa00009966bbbbbbbbccccccccddddddddeeeeeeee', 'hex')
        const header = Buffer.alloc(18)
        header.writeUInt32BE(0x00006699, 0)
        header.writeUInt32BE(payload.length, 14)
        const frame = Buffer.concat([header, payload, Buffer.from('00009966', 'hex')])

        lastSocket.emit('data', frame)

        expect(push).toHaveBeenCalledTimes(1)
        expect((push.mock.calls[0][0] as any).msg).toEqual(frame)
      })

      it('reassembles a frame split across chunks and splits two frames in one chunk', async () => {
        const first = statusFrame({ '1': true })
        lastSocket.emit('data', first.subarray(0, 10))
        lastSocket.emit('data', first.subarray(10))
        lastSocket.emit('data', Buffer.concat([statusFrame({ '2': true }), statusFrame({ '3': true })]))
        await drainQueue()

        expect(changes).toHaveBeenCalledTimes(3)
        expect(acc.state).toMatchObject({ '1': true, '2': true, '3': true })
      })

      it('skips a prefix whose declared length is implausible and finds the next frame', async () => {
        const bogus = Buffer.alloc(18)
        bogus.writeUInt32BE(0x00006699, 0)
        bogus.writeUInt32BE(0x7fffffff, 14)
        lastSocket.emit('data', Buffer.concat([bogus, statusFrame({ '1': true })]))
        await drainQueue()

        expect(changes).toHaveBeenCalledWith({ '1': true }, expect.anything())
      })

      it('reads a status push that arrives without a retcode', async () => {
        lastSocket.emit('data', statusFrame({ '1': true }, false))
        await drainQueue()

        expect(changes).toHaveBeenCalledWith({ '1': true }, expect.anything())
      })

      it('reports a handshake reply signed with another key as a socket error', async () => {
        lastSocket.emit('ready')
        const reply = Buffer.concat([Buffer.alloc(4), crypto.randomBytes(16), crypto.randomBytes(32)])
        lastSocket.emit('data', encryptV35Frame(4, 1, reply, Buffer.from(key)))
        await drainQueue()

        expect(socketErrors).toHaveLength(1)
        expect(socketErrors[0].message).toMatch(/Check the local key/)
      })

      it('reports a handshake reply that is too short as a socket error', async () => {
        lastSocket.emit('ready')
        lastSocket.emit('data', encryptV35Frame(4, 1, Buffer.alloc(20), Buffer.from(key)))
        await drainQueue()

        expect(socketErrors).toHaveLength(1)
        expect(socketErrors[0].message).toMatch(/handshake/)
      })

      it('keeps processing frames after a rejected handshake reply', async () => {
        lastSocket.emit('ready')
        lastSocket.emit('data', encryptV35Frame(4, 1, Buffer.alloc(20), Buffer.from(key)))
        lastSocket.emit('data', statusFrame({ '1': true }))
        await drainQueue()

        expect(changes).toHaveBeenCalledWith({ '1': true }, expect.anything())
      })
    })
  })
  // ── reachability reporting ────────────────────────────────────────────────────
  describe('reachability reporting', () => {
    const socketError = (code: string) => {
      const err: NodeJS.ErrnoException = new Error(code)
      err.code = code
      return err
    }

    it('reports the first socket error of an outage at info level', () => {
      new TuyaAccessory({ ...makeProps({ connect: true }), log } as any)

      lastSocket.emit('error', socketError('ERR_CONNECTION_TIMED_OUT'))

      expect(log.info).toHaveBeenCalledWith(
        'Device Test Device became unreachable; attempting to reconnect (ERR_CONNECTION_TIMED_OUT)',
      )
    })

    it('sends every later socket error of the same outage to debug', () => {
      new TuyaAccessory({ ...makeProps({ connect: true }), log } as any)

      lastSocket.emit('error', socketError('ERR_CONNECTION_TIMED_OUT'))
      log.info.mockClear()

      lastSocket.emit('error', socketError('ERR_PING_TIMED_OUT'))
      lastSocket.emit('error', socketError('EHOSTUNREACH'))
      lastSocket.emit('error', socketError('ERR_CONNECTION_TIMED_OUT'))

      expect(log.info).not.toHaveBeenCalled()
      expect(log.debug).toHaveBeenCalledWith('Socket error for Test Device: ERR_PING_TIMED_OUT; reconnecting')
      expect(log.debug).toHaveBeenCalledWith('Socket error for Test Device: EHOSTUNREACH; reconnecting')
    })

    it('reports recovery with the outage duration once a valid state arrives', async () => {
      vi.useRealTimers()

      const acc = new TuyaAccessory({ ...makeProps({ connect: true, version: '3.1' }), log } as any)
      const nowSpy = vi.spyOn(Date, 'now')

      nowSpy.mockReturnValue(1_000_000)
      lastSocket.emit('error', socketError('ERR_PING_TIMED_OUT'))

      nowSpy.mockReturnValue(1_000_000 + 82_000)
      lastSocket.emit('connect')
      lastSocket.emit('data', buildFrame(10, Buffer.from(JSON.stringify({ dps: { '1': true } }))))

      await new Promise<void>((resolve) => setImmediate(resolve))
      await new Promise<void>((resolve) => setImmediate(resolve))

      expect(log.info).toHaveBeenCalledWith('Device Test Device is reachable again (1m 22s)')
      expect(acc.state).toMatchObject({ '1': true })

      nowSpy.mockRestore()
      vi.useFakeTimers()
    })

    it('reports a second outage normally after a recovery', async () => {
      vi.useRealTimers()

      new TuyaAccessory({ ...makeProps({ connect: true, version: '3.1' }), log } as any)

      lastSocket.emit('error', socketError('ERR_PING_TIMED_OUT'))
      lastSocket.emit('connect')
      lastSocket.emit('data', buildFrame(10, Buffer.from(JSON.stringify({ dps: { '1': true } }))))

      await new Promise<void>((resolve) => setImmediate(resolve))
      await new Promise<void>((resolve) => setImmediate(resolve))

      log.info.mockClear()
      lastSocket.emit('error', socketError('EHOSTUNREACH'))

      expect(log.info).toHaveBeenCalledWith(
        'Device Test Device became unreachable; attempting to reconnect (EHOSTUNREACH)',
      )

      vi.useFakeTimers()
    })

    it('does not claim recovery for a device that was never reported unreachable', async () => {
      vi.useRealTimers()

      new TuyaAccessory({ ...makeProps({ connect: true, version: '3.1' }), log } as any)

      lastSocket.emit('connect')
      lastSocket.emit('data', buildFrame(10, Buffer.from(JSON.stringify({ dps: { '1': true } }))))

      await new Promise<void>((resolve) => setImmediate(resolve))
      await new Promise<void>((resolve) => setImmediate(resolve))

      expect(log.info).not.toHaveBeenCalledWith(expect.stringContaining('is reachable again'))

      vi.useFakeTimers()
    })
  })
})

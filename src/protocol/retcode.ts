// A v3.5 payload from a device usually starts with a 4-byte return code. Replies carry
// it, but a device-initiated push or a broadcast may not, and slicing blindly would eat
// the start of the JSON. So strip it only when the payload does not already open with
// the version header ("3.5") or a JSON object.
export function stripRetcode(payload: Buffer): Buffer {
  if (payload.length < 4) return payload
  if (payload[0] === 0x7b || payload.subarray(0, 3).toString('latin1') === '3.5') return payload
  return payload.subarray(4)
}

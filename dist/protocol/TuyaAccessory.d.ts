import { EventEmitter } from 'events';
import type { Logger } from 'homebridge';
import type { DPSState, DPSValue, TuyaDeviceContext } from '../types';
declare class TuyaAccessory extends EventEmitter {
    log: Logger;
    context: TuyaDeviceContext & {
        port: number;
        pingGap?: number;
        pingTimeout?: number;
        connectTimeout?: number;
        intro?: boolean;
        sendEmptyUpdate?: boolean;
        fake?: boolean;
    };
    state: DPSState;
    connected: boolean;
    private _cachedBuffer;
    private _msgQueue;
    private _socket;
    private _connectionAttempts;
    private _sendCounter;
    private _tmpLocalKey;
    private _tmpRemoteKey;
    session_key: Buffer | null;
    constructor(props: Partial<TuyaDeviceContext> & {
        log: Logger;
        fake?: boolean;
        port?: number;
        connect?: boolean;
    });
    _connect(): void;
    private _incrementAttemptCounter;
    private _msgHandler_3_1;
    private _msgHandler_3_3;
    private _msgHandler_3_4;
    update(o?: Record<string, DPSValue>): boolean;
    private _change;
    private _send;
    private _send_3_1;
    private _send_3_3;
    private _fakeUpdate;
    private _send_3_4;
}
export default TuyaAccessory;
//# sourceMappingURL=TuyaAccessory.d.ts.map
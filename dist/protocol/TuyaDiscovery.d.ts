import { EventEmitter } from 'events';
import type { Logger } from 'homebridge';
interface DiscoveryOptions {
    log: Logger;
    ids?: string[];
    clear?: boolean;
}
declare class TuyaDiscovery extends EventEmitter {
    discovered: Map<string, string>;
    limitedIds: string[];
    log: Logger;
    private _servers;
    private _running;
    constructor();
    start(props: DiscoveryOptions): this;
    stop(): this;
    end(): this;
    private _start;
    private _stop;
    private _onDgramError;
    private _onDgramClose;
    private _onDgramMessage;
    private _onDiscover;
}
declare const _default: TuyaDiscovery;
export default _default;
//# sourceMappingURL=TuyaDiscovery.d.ts.map
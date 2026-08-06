"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = __importDefault(require("dgram"));
const crypto_1 = __importDefault(require("crypto"));
const events_1 = require("events");
const UDP_KEY = Buffer.from('6c1ec8e2bb9bb59ab50b0daf649b410a', 'hex');
class TuyaDiscovery extends events_1.EventEmitter {
    discovered = new Map();
    limitedIds = [];
    log;
    _servers = {};
    _running = false;
    constructor() {
        super();
    }
    start(props) {
        this.log = props.log;
        if (props.clear) {
            this.removeAllListeners();
            this.discovered.clear();
        }
        this.limitedIds.splice(0);
        if (Array.isArray(props.ids))
            [].push.apply(this.limitedIds, props.ids);
        this._running = true;
        this._start(6666);
        this._start(6667);
        return this;
    }
    stop() {
        this._running = false;
        this._stop(6666);
        this._stop(6667);
        return this;
    }
    end() {
        this.stop();
        process.nextTick(() => {
            this.removeAllListeners();
            this.discovered.clear();
            this.log.info('Discovery ended.');
            this.emit('end');
        });
        return this;
    }
    _start(port) {
        this._stop(port);
        const server = (this._servers[port] = dgram_1.default.createSocket({ type: 'udp4', reuseAddr: true }));
        server.on('error', this._onDgramError.bind(this, port));
        server.on('close', this._onDgramClose.bind(this, port));
        server.on('message', this._onDgramMessage.bind(this, port));
        server.bind(port, () => {
            this.log.info(`Discovery - Discovery started on port ${port}.`);
        });
    }
    _stop(port) {
        if (this._servers[port]) {
            this._servers[port].removeAllListeners();
            this._servers[port].close();
            this._servers[port] = null;
        }
    }
    _onDgramError(port, err) {
        this._stop(port);
        if (err && err.code === 'EADDRINUSE') {
            this.log.warn(`Discovery - Port ${port} is in use. Will retry in 15 seconds.`);
            setTimeout(() => {
                this._start(port);
            }, 15000);
        }
        else {
            this.log.error(`Discovery - Port ${port} failed:\n${err.stack}`);
        }
    }
    _onDgramClose(port) {
        this._stop(port);
        this.log.info(`Discovery - Port ${port} closed.${this._running ? ' Restarting...' : ''}`);
        if (this._running)
            setTimeout(() => {
                this._start(port);
            }, 1000);
    }
    _onDgramMessage(port, msg, info) {
        const len = msg.length;
        if (len < 16 || msg.readUInt32BE(0) !== 0x000055aa || msg.readUInt32BE(len - 4) !== 0x0000aa55) {
            this.log.error(`Discovery - UDP from ${info.address}:${port}`, msg.toString('hex'));
            return;
        }
        const size = msg.readUInt32BE(12);
        if (len - size < 8) {
            this.log.error(`Discovery - UDP from ${info.address}:${port} size ${len - size}`);
            return;
        }
        const cleanMsg = msg.slice(len - size + 4, len - 8);
        let decryptedMsg;
        if (port === 6667) {
            try {
                const decipher = crypto_1.default.createDecipheriv('aes-128-ecb', UDP_KEY, '');
                decryptedMsg = decipher.update(cleanMsg, undefined, 'utf8');
                decryptedMsg += decipher.final('utf8');
            }
            catch (_ex) {
                // Encrypted broadcast could not be decrypted — device may already
                // have been discovered on port 6666.  Silently ignore.
                return;
            }
        }
        if (!decryptedMsg)
            decryptedMsg = cleanMsg.toString('utf8');
        try {
            const result = JSON.parse(decryptedMsg);
            if (result && result.gwId && result.ip)
                this._onDiscover(result);
            else
                this.log.error(`Discovery - UDP from ${info.address}:${port} decrypted`, cleanMsg.toString('hex'));
        }
        catch (_ex) {
            this.log.error(`Discovery - Failed to parse discovery response on port ${port}: ${decryptedMsg}`);
            this.log.error(`Discovery - Failed to parse discovery raw message on port ${port}: ${msg.toString('hex')}`);
        }
    }
    _onDiscover(data) {
        if (this.discovered.has(data.gwId))
            return;
        data.id = data.gwId;
        delete data.gwId;
        this.discovered.set(data.id, data.ip);
        this.emit('discover', data);
        if (this.limitedIds.length &&
            this.limitedIds.includes(data.id) &&
            this.limitedIds.length <= this.discovered.size &&
            this.limitedIds.every((id) => this.discovered.has(id))) {
            process.nextTick(() => {
                this.end();
            });
        }
    }
}
exports.default = new TuyaDiscovery();
//# sourceMappingURL=TuyaDiscovery.js.map
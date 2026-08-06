"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaCommand = exports.TuyaProtocolVersion = void 0;
var TuyaProtocolVersion;
(function (TuyaProtocolVersion) {
    TuyaProtocolVersion["V3_1"] = "3.1";
    TuyaProtocolVersion["V3_3"] = "3.3";
    TuyaProtocolVersion["V3_4"] = "3.4";
})(TuyaProtocolVersion || (exports.TuyaProtocolVersion = TuyaProtocolVersion = {}));
var TuyaCommand;
(function (TuyaCommand) {
    TuyaCommand[TuyaCommand["CONTROL"] = 7] = "CONTROL";
    TuyaCommand[TuyaCommand["STATUS"] = 8] = "STATUS";
    TuyaCommand[TuyaCommand["HEART_BEAT"] = 9] = "HEART_BEAT";
    TuyaCommand[TuyaCommand["DP_QUERY"] = 10] = "DP_QUERY";
    TuyaCommand[TuyaCommand["DP_QUERY_NEW"] = 16] = "DP_QUERY_NEW";
    TuyaCommand[TuyaCommand["SESS_KEY_NEG_START"] = 3] = "SESS_KEY_NEG_START";
    TuyaCommand[TuyaCommand["SESS_KEY_NEG_RES"] = 4] = "SESS_KEY_NEG_RES";
    TuyaCommand[TuyaCommand["SESS_KEY_NEG_FINISH"] = 5] = "SESS_KEY_NEG_FINISH";
})(TuyaCommand || (exports.TuyaCommand = TuyaCommand = {}));
//# sourceMappingURL=types.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = void 0;
const zod_1 = require("zod");
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
exports.logout = {
    body: zod_1.z
        .strictObject({
        flag: zod_1.z.enum(token_secuirty_1.LogoutEnum).default(token_secuirty_1.LogoutEnum.only),
    })
};

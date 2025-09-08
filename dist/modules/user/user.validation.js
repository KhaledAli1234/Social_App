"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDelete = exports.restoreAccount = exports.freezeAccount = exports.logout = void 0;
const zod_1 = require("zod");
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const mongoose_1 = require("mongoose");
exports.logout = {
    body: zod_1.z.strictObject({
        flag: zod_1.z.enum(token_secuirty_1.LogoutEnum).default(token_secuirty_1.LogoutEnum.only),
    }),
};
exports.freezeAccount = {
    params: zod_1.z
        .object({
        userId: zod_1.z.string().optional(),
    })
        .optional()
        .refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, {
        error: "invalid objectId format",
        path: ["userId"],
    }),
};
exports.restoreAccount = {
    params: zod_1.z
        .object({
        userId: zod_1.z.string(),
    })
        .refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data.userId);
    }, {
        error: "invalid objectId format",
        path: ["userId"],
    }),
};
exports.hardDelete = exports.restoreAccount;

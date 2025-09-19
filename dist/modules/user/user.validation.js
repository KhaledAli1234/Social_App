"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmTwoStep = exports.confirmEmail = exports.updateEmail = exports.updateBasicInfo = exports.changeRole = exports.acceptFriendRequest = exports.sendFriendRequest = exports.updatePassword = exports.hardDelete = exports.restoreAccount = exports.freezeAccount = exports.logout = void 0;
const zod_1 = require("zod");
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const mongoose_1 = require("mongoose");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const DB_1 = require("../../DB");
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
exports.updatePassword = {
    body: zod_1.z
        .strictObject({
        oldPassword: zod_1.z.string().min(6),
        newPassword: zod_1.z.string().min(6),
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
    })
        .refine((data) => data.oldPassword !== data.newPassword, {
        path: ["newPassword"],
        message: "New password must be different from old password",
    }),
};
exports.sendFriendRequest = {
    params: zod_1.z.strictObject({
        userId: validation_middleware_1.generalFields.id,
    })
};
exports.acceptFriendRequest = {
    params: zod_1.z.strictObject({
        requestId: validation_middleware_1.generalFields.id,
    })
};
exports.changeRole = {
    params: exports.sendFriendRequest.params,
    body: zod_1.z.strictObject({
        role: zod_1.z.enum(DB_1.RoleEnum),
    }),
};
exports.updateBasicInfo = {
    body: zod_1.z.strictObject({
        username: validation_middleware_1.generalFields.username.optional(),
        phone: validation_middleware_1.generalFields.phone.optional(),
    }),
};
exports.updateEmail = {
    body: zod_1.z.strictObject({
        newEmail: validation_middleware_1.generalFields.email,
    }),
};
exports.confirmEmail = {
    body: zod_1.z.strictObject({
        otp: validation_middleware_1.generalFields.otp,
    }),
};
exports.confirmTwoStep = {
    body: zod_1.z.strictObject({
        otp: validation_middleware_1.generalFields.otp,
    }),
};

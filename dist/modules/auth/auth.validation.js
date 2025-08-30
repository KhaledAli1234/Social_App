"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = exports.resetForgotPassword = exports.verifyForgotPassword = exports.sendForgotPassword = exports.signupWithGmail = exports.confirmEmail = exports.login = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.login = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    }),
};
exports.confirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
    }),
};
exports.signupWithGmail = {
    body: zod_1.z.strictObject({
        idToken: zod_1.z.string(),
    }),
};
exports.sendForgotPassword = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
    }),
};
exports.verifyForgotPassword = {
    body: exports.sendForgotPassword.body.extend({
        otp: validation_middleware_1.generalFields.otp,
    }),
};
exports.resetForgotPassword = {
    body: exports.verifyForgotPassword.body
        .extend({
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
    })
        .refine((data) => {
        return data.password === data.confirmPassword;
    }, { message: "password mismatch confirmPassword", path: ["confirmPassword"] }),
};
exports.signup = {
    body: exports.login.body
        .extend({
        username: validation_middleware_1.generalFields.username,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
    })
        .superRefine((data, ctx) => {
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "password missMatch confirmPassword",
            });
        }
    }),
};

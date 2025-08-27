"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const zod_1 = __importDefault(require("zod"));
const error_response_1 = require("../utils/response/error.response");
const validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key]) {
                continue;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationError.push({
                    key,
                    issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path[0] };
                    }),
                });
            }
        }
        if (validationError.length) {
            throw new error_response_1.BadRequestException("validation Error", {
                validationError,
            });
        }
        return next();
    };
};
exports.validation = validation;
exports.generalFields = {
    username: zod_1.default.string().min(2).max(20),
    email: zod_1.default.email(),
    password: zod_1.default
        .string()
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: zod_1.default.string(),
    otp: zod_1.default.string().regex(/^\d{6}$/),
};

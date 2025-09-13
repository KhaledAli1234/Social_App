"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const zod_1 = __importDefault(require("zod"));
const error_response_1 = require("../utils/response/error.response");
const mongoose_1 = require("mongoose");
const validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key]) {
                continue;
            }
            if (req.file) {
                req.body.attachment = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationError.push({
                    key,
                    issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path };
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
    file: function (mimetype) {
        return zod_1.default
            .strictObject({
            fieldname: zod_1.default.string(),
            originalname: zod_1.default.string(),
            encoding: zod_1.default.string(),
            mimetype: zod_1.default.enum(mimetype),
            buffer: zod_1.default.any().optional(),
            path: zod_1.default.string().optional(),
            size: zod_1.default.number(),
        })
            .refine((data) => {
            return data.buffer || data.path;
        }, {
            error: "neither path or buffer is available",
            path: ["file"],
        });
    },
    id: zod_1.default.string().refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data);
    }, { error: "invalid objectId format" }),
};

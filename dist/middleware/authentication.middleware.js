"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = exports.authentication = void 0;
const token_secuirty_1 = require("../utils/secuirty/token.secuirty");
const error_response_1 = require("../utils/response/error.response");
const authentication = (tokenType = token_secuirty_1.TokenEnum.access) => {
    return async (req, res, next) => {
        if (!req.headers.authorization) {
            throw new error_response_1.BadRequestException("Validation error", {
                key: "headers",
                issuse: [{ path: "authorization", message: "Missing authorization" }],
            });
        }
        const { user, decoded } = await (0, token_secuirty_1.decodedToken)({
            authorization: req.headers.authorization,
            tokenType,
        });
        req.user = user;
        req.decoded = decoded;
        return next();
    };
};
exports.authentication = authentication;
const authorization = (accessRole = [], tokenType = token_secuirty_1.TokenEnum.access) => {
    return async (req, res, next) => {
        if (!req.headers.authorization) {
            throw new error_response_1.BadRequestException("Validation error", {
                key: "headers",
                issuse: [{ path: "authorization", message: "Missing authorization" }],
            });
        }
        const { user, decoded } = await (0, token_secuirty_1.decodedToken)({
            authorization: req.headers.authorization,
            tokenType
        });
        if (!accessRole.includes(user.role)) {
            throw new error_response_1.ForbiddenException("Not authorized account");
        }
        req.user = user;
        req.decoded = decoded;
        return next();
    };
};
exports.authorization = authorization;

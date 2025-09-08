"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = void 0;
const successResponse = ({ res, message = "Done", statusCode = 200, data, }) => {
    return res.status(statusCode).json({ message, statusCode, data });
};
exports.successResponse = successResponse;

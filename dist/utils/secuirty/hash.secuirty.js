"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.generatHash = void 0;
const bcrypt_1 = require("bcrypt");
const generatHash = async (plainText, saltRound = Number(process.env.SALT)) => {
    return await (0, bcrypt_1.hash)(plainText, saltRound);
};
exports.generatHash = generatHash;
const compareHash = async (plainText, hash) => {
    return await (0, bcrypt_1.compare)(plainText, hash);
};
exports.compareHash = compareHash;

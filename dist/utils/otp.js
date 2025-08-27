"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNumberOtp = void 0;
const generateNumberOtp = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
exports.generateNumberOtp = generateNumberOtp;

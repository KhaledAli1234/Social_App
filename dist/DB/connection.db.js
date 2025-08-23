"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.DB_URI);
        console.log("DB connected ✅");
    }
    catch (err) {
        console.error("Fail to connect on DB ❌", err);
        process.exit(1);
    }
};
exports.default = connectDB;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_model_1 = require("./models/User.model");
const connectDB = async () => {
    try {
        const result = await (0, mongoose_1.connect)(process.env.DB_URI);
        await User_model_1.UserModel.syncIndexes();
        console.log(result.models);
        console.log("DB connected ✅");
    }
    catch (err) {
        console.error("Fail to connect on DB ❌", err);
    }
};
exports.default = connectDB;

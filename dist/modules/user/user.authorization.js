"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoint = void 0;
const User_model_1 = require("../../DB/models/User.model");
exports.endpoint = {
    welcome: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    profile: [User_model_1.RoleEnum.user],
    restoreAccount: [User_model_1.RoleEnum.admin],
    hardDelete: [User_model_1.RoleEnum.admin],
    dashboard: [User_model_1.RoleEnum.admin, User_model_1.RoleEnum.superAdmin],
};

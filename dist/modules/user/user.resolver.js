"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const user_authorization_1 = require("./user.authorization");
const user_service_1 = require("./user.service");
const validators = __importStar(require("./user.validation"));
class UserResolver {
    userService = new user_service_1.UserService();
    constructor() { }
    welcome = async (parent, args, context) => {
        await (0, validation_middleware_1.graphValidation)(validators.welcome, args);
        await (0, authentication_middleware_1.graphAuthorization)(user_authorization_1.endpoint.welcome, context.user.role);
        return this.userService.welcome(context.user);
    };
    allUsers = async (parent, args, context) => {
        return await this.userService.allUsers(args, context.user);
    };
    search = (parent, args) => {
        return this.userService.search(args);
    };
    addFollower = (parent, args) => {
        return this.userService.addFollower(args);
    };
}
exports.UserResolver = UserResolver;

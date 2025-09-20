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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const validators = __importStar(require("./user.validation"));
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const user_authorization_1 = require("./user.authorization");
const router = (0, express_1.Router)();
router.delete("{/:userId}/freeze-account", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.freezeAccount), user_service_1.default.freezeAccount);
router.delete("/:userId", (0, authentication_middleware_1.authorization)(user_authorization_1.endpoint.hardDelete), (0, validation_middleware_1.validation)(validators.hardDelete), user_service_1.default.hardDeleteAccount);
router.patch("/:userId/restore-account", (0, authentication_middleware_1.authorization)(user_authorization_1.endpoint.restoreAccount), (0, validation_middleware_1.validation)(validators.restoreAccount), user_service_1.default.restoreAccount);
router.get("/", (0, authentication_middleware_1.authentication)(), user_service_1.default.profile);
router.get("/dashboard", (0, authentication_middleware_1.authorization)(user_authorization_1.endpoint.dashboard), user_service_1.default.dashboard);
router.patch("/:userId/change-role", (0, authentication_middleware_1.authorization)(user_authorization_1.endpoint.dashboard), (0, validation_middleware_1.validation)(validators.changeRole), user_service_1.default.changeRole);
router.post("/:userId/send-friend-request", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.sendFriendRequest), user_service_1.default.sendFriendRequest);
router.patch("/accept-friend-request/:requestId", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.acceptFriendRequest), user_service_1.default.acceptFriendRequest);
router.patch("/profile-image", (0, authentication_middleware_1.authentication)(), user_service_1.default.profileImage);
router.patch("/profile-cover-image", (0, authentication_middleware_1.authentication)(), (0, cloud_multer_1.cloudFileUploud)({ validation: cloud_multer_1.fileValidation.image, storageApproach: cloud_multer_1.StorageEnum.disk }).array("images", 2), user_service_1.default.profileCoverImage);
router.post("/refresh-token", (0, authentication_middleware_1.authentication)(token_secuirty_1.TokenEnum.refresh), user_service_1.default.refreshToken);
router.post("/logout", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.logout), user_service_1.default.logout);
router.patch("/update-password", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updatePassword), user_service_1.default.updatePassword);
router.patch("/update-basic-info", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updateBasicInfo), user_service_1.default.updateBasicInfo);
router.post("/update-email/request", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updateEmail), user_service_1.default.requestUpdateEmail);
router.post("/update-email/confirm", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.confirmEmail), user_service_1.default.confirmUpdateEmail);
router.post("/enable", (0, authentication_middleware_1.authentication)(), user_service_1.default.enableTwoStep);
router.post("/confirm", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.confirmTwoStep), user_service_1.default.confirmEnableTwoStep);
router.delete("/requests/:requestId", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.deleteFriendRequest), user_service_1.default.deleteFriendRequest);
router.patch("/unfriend/:friendId", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.unFriend), user_service_1.default.unFriend);
router.patch("/block/:userId", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.blockUser), user_service_1.default.blockUser);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const error_response_1 = require("../../utils/response/error.response");
const s3_events_1 = require("../../utils/multer/s3.events");
const success_response_1 = require("../../utils/response/success.response");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    profile = async (req, res) => {
        if (!req.user) {
            throw new error_response_1.UnauthorizedException("missing user details");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "Profile fetched",
            data: { user: req.user },
        });
    };
    profileImage = async (req, res) => {
        const { ContentType, Originalname, } = req.body;
        const { url, key } = await (0, s3_config_1.createPresignedUploadLink)({
            ContentType,
            Originalname,
            path: `users/${req.decoded?._id}`,
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                profileImage: key,
                temProfileImage: req.user?.profileImage,
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("fail to update user profile image");
        }
        s3_events_1.s3Event.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            key,
            expiresIn: 30000,
        });
        return (0, success_response_1.successResponse)({
            res,
            message: "Profile fetched",
            data: {
                url,
            },
        });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            files: req.files,
            path: `user/${req.decoded?._id}/cover`,
            useLarge: true,
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                coverImages: urls,
            },
        });
        if (!user) {
            throw new error_response_1.BadRequestException("fail to update profile cover image");
        }
        if (req.user?.coverImages) {
            await (0, s3_config_1.deleteFiles)({ urls: req.user.coverImages });
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "Profile fetched",
            data: { user },
        });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_secuirty_1.LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_secuirty_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return (0, success_response_1.successResponse)({
            res,
            message: "Logout successful",
            statusCode: statusCode,
        });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_secuirty_1.createLoginCredentials)(req.user);
        await (0, token_secuirty_1.createRevokeToken)(req.decoded);
        return (0, success_response_1.successResponse)({
            res,
            statusCode: 201,
            data: { credentials },
        });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params || {};
        if (userId && req.user?.role !== User_model_1.RoleEnum.admin) {
            throw new error_response_1.ForbiddenException("not authorized user");
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.user?._id,
                freezedAt: { $exists: false },
            },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1,
                },
            },
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException("user not found or fail to delete");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "freezed successful",
        });
    };
    restoreAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId,
                freezedBy: { $ne: userId },
            },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                $unset: {
                    freezedAt: 1,
                    freezedBy: 1,
                },
            },
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException("user not found or fail to restore");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "restored successful",
        });
    };
    hardDeleteAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                freezedAt: { $exists: true },
            },
        });
        if (!user.deletedCount) {
            throw new error_response_1.NotFoundException("user not found or fail to hard delete");
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return (0, success_response_1.successResponse)({
            res,
            message: "deleted successful",
        });
    };
}
exports.default = new AuthenticationService();

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
const bcrypt_1 = require("bcrypt");
const otp_1 = require("../../utils/otp");
const email_event_1 = require("../../utils/email/email.event");
class UserService {
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
    updatePassword = async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const user = await this.userModel.findById({
            id: req.user?._id,
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User not found");
        }
        const isMatch = await (0, bcrypt_1.compare)(oldPassword, user.password);
        if (!isMatch) {
            throw new error_response_1.UnauthorizedException("Invalid old password");
        }
        user.password = newPassword;
        await user.save();
        return (0, success_response_1.successResponse)({
            res,
            message: "Password updated successfully",
            data: { user },
        });
    };
    updateBasicInfo = async (req, res) => {
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                id: req.user?._id,
            },
            update: req.body,
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        return (0, success_response_1.successResponse)({
            res,
            message: "User info updated successfully",
            data: { user },
        });
    };
    requestUpdateEmail = async (req, res) => {
        const { newEmail } = req.body;
        const otp = (0, otp_1.generateNumberOtp)();
        email_event_1.emailEvent.emit("confirmEmail", {
            to: newEmail,
            otp,
        });
        await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: { pendingEmail: newEmail, emailOtp: otp },
        });
        return (0, success_response_1.successResponse)({ res, message: "OTP sent to new email" });
    };
    confirmUpdateEmail = async (req, res) => {
        const { otp } = req.body;
        const user = await this.userModel.findById({
            id: req.user?._id,
        });
        if (!user)
            throw new error_response_1.BadRequestException("User not found");
        if (user.emailOtp !== otp)
            throw new error_response_1.BadRequestException("Invalid OTP");
        user.email = user.pendingEmail;
        user.pendingEmail = undefined;
        user.emailOtp = undefined;
        await user.save();
        return (0, success_response_1.successResponse)({ res, message: "Email updated successfully" });
    };
    enableTwoStep = async (req, res) => {
        const otp = (0, otp_1.generateNumberOtp)();
        await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: { twoStepOtp: otp },
        });
        email_event_1.emailEvent.emit("twoFactorOtp", {
            to: req.user?.email,
            otp,
        });
        return (0, success_response_1.successResponse)({ res, message: "OTP sent to your email" });
    };
    confirmEnableTwoStep = async (req, res) => {
        const { otp } = req.body;
        const user = await this.userModel.findById({
            id: req.user?._id,
        });
        if (!user || user.twoStepOtp !== otp)
            throw new error_response_1.BadRequestException("Invalid OTP");
        user.isTwoStepEnabled = true;
        user.twoStepOtp = undefined;
        await user.save();
        return (0, success_response_1.successResponse)({ res, message: "Two-step verification enabled" });
    };
}
exports.default = new UserService();

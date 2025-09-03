"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    profile = async (req, res) => {
        return res.status(200).json({
            message: "Profile fetched",
            data: { user: req.user?._id, decoded: req.decoded?.iat },
        });
    };
    profileImage = async (req, res) => {
        const { ContentType, originalname, } = req.body;
        const { url, key } = await (0, s3_config_1.createPresignedUploadLink)({
            ContentType,
            originalname,
            path: `users/${req.decoded?._id}`,
        });
        return res.status(200).json({
            message: "Profile fetched",
            data: {
                url,
                key,
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
        return res.status(200).json({
            message: "Profile fetched",
            data: {
                urls,
            },
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
        return res.status(statusCode).json({
            message: "Logout successful",
        });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_secuirty_1.createLoginCredentials)(req.user);
        await (0, token_secuirty_1.createRevokeToken)(req.decoded);
        return res
            .status(201)
            .json({ message: "Login successful", data: { credentials } });
    };
}
exports.default = new AuthenticationService();

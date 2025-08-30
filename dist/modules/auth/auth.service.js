"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const hash_secuirty_1 = require("../../utils/secuirty/hash.secuirty");
const email_event_1 = require("../../utils/events/email.event");
const otp_1 = require("../../utils/otp");
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const google_auth_library_1 = require("google-auth-library");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    verifyGoogleAccount = async (idToken) => {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_ID?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequestException("fail to verify this google account");
        }
        return payload;
    };
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        const checkUserExist = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: {
                lean: true,
            },
        });
        if (checkUserExist) {
            throw new error_response_1.ConflictException("Email exist");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const user = await this.userModel.createUser({
            data: [
                {
                    username,
                    email,
                    password: await (0, hash_secuirty_1.generatHash)(password),
                    confirmEmailOtp: await (0, hash_secuirty_1.generatHash)(String(otp)),
                },
            ],
        });
        user.save();
        email_event_1.emailEvent.emit("confirmEmail", { to: email, otp });
        return res
            .status(201)
            .json({ message: "User created successfully", data: { user } });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.system,
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid login data");
        }
        if (!user.confirmAt) {
            throw new error_response_1.BadRequestException("Please verify your email first");
        }
        const isMatch = await (0, hash_secuirty_1.compareHash)(password, user.password);
        if (!isMatch) {
            throw new error_response_1.BadRequestException("Invalid login data");
        }
        const credentials = await (0, token_secuirty_1.createLoginCredentials)(user);
        return res
            .status(200)
            .json({ message: "Login successful", data: { credentials } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmAt: { $exists: false },
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        if (!(await (0, hash_secuirty_1.compareHash)(otp, user.confirmEmailOtp))) {
            throw new error_response_1.ConflictException("Invalid confirmation code");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmAt: new Date(),
                $unset: { confirmEmailOtp: 1 },
            },
        });
        return res.status(200).json({ message: "Email verified successfully" });
    };
    sendForgotPassword = async (req, res) => {
        const { email } = req.body;
        const otp = (0, otp_1.generateNumberOtp)();
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmAt: { $exists: true },
                provider: User_model_1.ProviderEnum.system,
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        const result = await this.userModel.updateOne({
            filter: {
                email,
            },
            update: {
                resetPasswordOtp: await (0, hash_secuirty_1.generatHash)(String(otp)),
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Fail to send reset code");
        }
        email_event_1.emailEvent.emit("resetPassword", {
            to: email,
            otp,
        });
        return res.status(200).json({ message: "OTP sent successfully" });
    };
    verifyForgotPassword = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                resetPasswordOtp: { $exists: true },
                provider: User_model_1.ProviderEnum.system,
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        if (!(await (0, hash_secuirty_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid OTP");
        }
        return res.status(200).json({ message: "OTP verified successfully" });
    };
    resetForgotPassword = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                resetPasswordOtp: { $exists: true },
                provider: User_model_1.ProviderEnum.system,
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        if (!(await (0, hash_secuirty_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid OTP");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                $unset: { resetPasswordOtp: 1 },
                password: await (0, hash_secuirty_1.generatHash)(password),
                changeCredentialsTime: new Date(),
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Fail to  reset account password");
        }
        return res.status(200).json({ message: "Password reset successfully" });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGoogleAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
            },
        });
        if (user) {
            if (user.provider === User_model_1.ProviderEnum.google) {
                return this.loginWithGmail(req, res);
            }
            throw new error_response_1.ConflictException("Email already exists");
        }
        const [newUser] = (await this.userModel.create({
            data: [
                {
                    firstName: given_name,
                    lastName: family_name,
                    profileImage: picture,
                    email: email,
                    confirmAt: new Date(),
                    provider: User_model_1.ProviderEnum.google,
                },
            ],
        })) || [];
        if (!newUser) {
            throw new error_response_1.BadRequestException("Fail to signup with gmail");
        }
        const credentials = await (0, token_secuirty_1.createLoginCredentials)(newUser);
        return res.status(201).json({
            message: "User added successfully",
            data: { credentials },
        });
    };
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGoogleAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.google,
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid login data or provider");
        }
        const credentials = await (0, token_secuirty_1.createLoginCredentials)(user);
        return res.status(200).json({
            message: "Login successful",
            data: { credentials },
        });
    };
}
exports.default = new AuthenticationService();

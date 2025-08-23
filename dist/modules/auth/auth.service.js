"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const send_email_1 = require("../../utils/email/send.email");
const error_response_1 = require("../../utils/response/error.response");
const nanoid_1 = require("nanoid");
class AuthenticationService {
    constructor() { }
    signup = async (req, res) => {
        let { userName, email, password } = req.body;
        const exist = await User_model_1.UserModel.findOne({ email });
        if (exist) {
            throw new error_response_1.BadRequestException("User already exists");
        }
        const verificationCode = (0, nanoid_1.customAlphabet)("0123456789", 6)();
        const user = new User_model_1.UserModel({
            userName,
            email,
            password,
            verificationCode,
        });
        await user.save();
        await (0, send_email_1.sendEmail)({
            to: email,
            subject: "Confirm your account",
            html: `<p>Your code: <b>${verificationCode}</b></p>`,
        });
        return res
            .status(200)
            .json({ message: "User created successfully", data: req.body });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await User_model_1.UserModel.findOne({ email, password });
        if (!user) {
            throw new error_response_1.BadRequestException("Invalid credentials");
        }
        if (!user.isVerified) {
            throw new error_response_1.BadRequestException("Please verify your email first");
        }
        return res
            .status(200)
            .json({ message: "Login successful", data: req.body });
    };
    confirmEmail = async (req, res) => {
        const { email, code } = req.body;
        const user = await User_model_1.UserModel.findOne({ email });
        if (!user) {
            throw new error_response_1.BadRequestException("User not found");
        }
        if (user.verificationCode !== code) {
            throw new error_response_1.BadRequestException("Invalid verification code");
        }
        user.isVerified = true;
        user.verificationCode = "";
        await user.save();
        return res.status(200).json({ message: "Email verified successfully" });
    };
}
exports.default = new AuthenticationService();

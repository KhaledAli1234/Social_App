"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const hash_secuirty_1 = require("../../utils/secuirty/hash.secuirty");
const email_event_1 = require("../../utils/events/email.event");
const otp_1 = require("../../utils/otp");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
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
            filter: { email },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Account not found");
        }
        if (!user.confirmAt) {
            throw new error_response_1.BadRequestException("Please verify your email first");
        }
        const isMatch = await (0, hash_secuirty_1.compareHash)(password, user.password);
        if (!isMatch) {
            throw new error_response_1.BadRequestException("Invalid credentials");
        }
        return res
            .status(200)
            .json({ message: "Login successful" });
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
}
exports.default = new AuthenticationService();

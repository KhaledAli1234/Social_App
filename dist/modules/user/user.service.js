"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_secuirty_1 = require("../../utils/secuirty/token.secuirty");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const token_repository_1 = require("../../DB/repository/token.repository");
const Token_model_1 = require("../../DB/models/Token.model");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    constructor() { }
    profile = async (req, res) => {
        return res.status(200).json({
            message: "Profile fetched",
            data: { user: req.user?._id, decoded: req.decoded?.iat },
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

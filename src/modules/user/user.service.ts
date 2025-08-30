import type { Request, Response } from "express";
import {
  createLoginCredentials,
  createRevokeToken,
  LogoutEnum,
} from "../../utils/secuirty/token.secuirty";
import { ILogoutDTO } from "./user.dto";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { TokenRepository } from "../../DB/repository/token.repository";
import { TokenModel } from "../../DB/models/Token.model";
import { JwtPayload } from "jsonwebtoken";

class AuthenticationService {
  private userModel = new UserRepository(UserModel);
  private tokenModel = new TokenRepository(TokenModel);
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
      message: "Profile fetched",
      data: { user: req.user?._id, decoded: req.decoded?.iat },
    });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: ILogoutDTO = req.body;
    let statusCode: number = 200;
    const update: UpdateQuery<IUser> = {};
    switch (flag) {
      case LogoutEnum.all:
        update.changeCredentialsTime = new Date();
        break;

      default:
        await createRevokeToken(req.decoded as JwtPayload);
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

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload);
    return res
      .status(201)
      .json({ message: "Login successful", data: { credentials } });
  };
}

export default new AuthenticationService();

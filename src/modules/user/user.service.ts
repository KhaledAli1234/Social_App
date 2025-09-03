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
import { JwtPayload } from "jsonwebtoken";
import {
  createPresignedUploadLink,
  uploadFiles,
  uploadLargeFile,
} from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";

class AuthenticationService {
  private userModel = new UserRepository(UserModel);
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
      message: "Profile fetched",
      data: { user: req.user?._id, decoded: req.decoded?.iat },
    });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {
    // const key = await uploadLargeFile({
    //   storageApproach: StorageEnum.disk,
    //   file: req.file as Express.Multer.File,
    //   path: `user/${req.decoded?._id}`,
    // });
    const {
      ContentType,
      originalname,
    }: { ContentType: string; originalname: string } = req.body;
    const { url, key } = await createPresignedUploadLink({
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

  profileCoverImage = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const urls = await uploadFiles({
      storageApproach: StorageEnum.disk,
      files: req.files as Express.Multer.File[],
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

import type { Request, Response } from "express";
import {
  createLoginCredentials,
  createRevokeToken,
  LogoutEnum,
} from "../../utils/secuirty/token.secuirty";
import {
  IFreezeAccountDTO,
  IHardDeleteAccountDTO,
  ILogoutDTO,
  IRestoreAccountDTO,
} from "./user.dto";
import { Types, UpdateQuery } from "mongoose";
import {
  HUserDocument,
  IUser,
  RoleEnum,
  UserModel,
} from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { JwtPayload } from "jsonwebtoken";
import {
  createPresignedUploadLink,
  deleteFiles,
  deleteFolderByPrefix,
  uploadFiles,
} from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "../../utils/response/error.response";
import { s3Event } from "../../utils/multer/s3.events";
import { successResponse } from "../../utils/response/success.response";
import { IUserResponse, IProfileImageResponse } from "./user.entities";
import { ILoginResponse } from "../auth/auth.entities";

class UserService {
  private userModel = new UserRepository(UserModel);
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedException("missing user details");
    }
    return successResponse<IUserResponse>({
      res,
      message: "Profile fetched",
      data: { user: req.user },
    });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {
    const {
      ContentType,
      Originalname,
    }: { ContentType: string; Originalname: string } = req.body;
    const { url, key } = await createPresignedUploadLink({
      ContentType,
      Originalname,
      path: `users/${req.decoded?._id}`,
    });
    const user = await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: {
        profileImage: key,
        temProfileImage: req.user?.profileImage,
      },
    });

    if (!user) {
      throw new BadRequestException("fail to update user profile image");
    }
    s3Event.emit("trackProfileImageUpload", {
      userId: req.user?._id,
      oldKey: req.user?.profileImage,
      key,
      expiresIn: 30000,
    });

    return successResponse<IProfileImageResponse>({
      res,
      message: "Profile fetched",
      data: {
        url,
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

    const user = await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: {
        coverImages: urls,
      },
    });
    if (!user) {
      throw new BadRequestException("fail to update profile cover image");
    }

    if (req.user?.coverImages) {
      await deleteFiles({ urls: req.user.coverImages });
    }
    return successResponse<IUserResponse>({
      res,
      message: "Profile fetched",
      data: { user },
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

    return successResponse({
      res,
      message: "Logout successful",
      statusCode: statusCode,
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload);
    return successResponse<ILoginResponse>({
      res,
      statusCode: 201,
      data: { credentials },
    });
  };

  freezeAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = (req.params as IFreezeAccountDTO) || {};

    if (userId && req.user?.role !== RoleEnum.admin) {
      throw new ForbiddenException("not authorized user");
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
      throw new NotFoundException("user not found or fail to delete");
    }
    return successResponse({
      res,
      message: "freezed successful",
    });
  };

  restoreAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IRestoreAccountDTO;

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
      throw new NotFoundException("user not found or fail to restore");
    }
    return successResponse({
      res,
      message: "restored successful",
    });
  };

  hardDeleteAccount = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { userId } = req.params as IHardDeleteAccountDTO;

    const user = await this.userModel.deleteOne({
      filter: {
        _id: userId,
        freezedAt: { $exists: true },
      },
    });

    if (!user.deletedCount) {
      throw new NotFoundException("user not found or fail to hard delete");
    }
    await deleteFolderByPrefix({ path: `users/${userId}` });
    return successResponse({
      res,
      message: "deleted successful",
    });
  };
}

export default new UserService();

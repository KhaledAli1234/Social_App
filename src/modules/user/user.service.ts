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
import { compare} from "bcrypt";
import { generateNumberOtp } from "../../utils/otp";
import { emailEvent } from "../../utils/email/email.event";


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

  updatePassword = async (req: Request, res: Response): Promise<Response> => {
    const { oldPassword, newPassword } = req.body;

    const user = await this.userModel.findById({
      id: req.user?._id as Types.ObjectId,
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isMatch = await compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid old password");
    }

    user.password = newPassword;
    await user.save();

    return successResponse({
      res,
      message: "Password updated successfully",
      data: { user },
    });
  };

  updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {

    const user = await this.userModel.findOneAndUpdate({
      filter: {
        id: req.user?._id,
      },
      update: req.body,
    });

    if (!user) {
      throw new NotFoundException("Invalid account");
    }

    return successResponse({
      res,
      message: "User info updated successfully",
      data: { user },
    });
  };

  requestUpdateEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { newEmail } = req.body;
    const otp = generateNumberOtp();

    emailEvent.emit("confirmEmail", {
      to: newEmail,
      otp,
    });

    await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: { pendingEmail: newEmail, emailOtp: otp },
    });

    return successResponse({ res, message: "OTP sent to new email" });
  };

  confirmUpdateEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { otp } = req.body;

    const user = await this.userModel.findById({
      id: req.user?._id as Types.ObjectId,
    });

    if (!user) throw new BadRequestException("User not found");
    if (user.emailOtp !== otp) throw new BadRequestException("Invalid OTP");

    user.email = user.pendingEmail!;
    user.pendingEmail = undefined as unknown as string;
    user.emailOtp = undefined as unknown as string;

    await user.save();

    return successResponse({ res, message: "Email updated successfully" });
  };

  enableTwoStep = async (req: Request, res: Response): Promise<Response> => {
    const otp = generateNumberOtp();
    await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: { twoStepOtp: otp },
    });
    emailEvent.emit("twoFactorOtp", {
      to: req.user?.email!,
      otp,
    });

    return successResponse({ res, message: "OTP sent to your email" });
  };

  confirmEnableTwoStep = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { otp } = req.body;
    const user = await this.userModel.findById({
      id: req.user?._id as Types.ObjectId,
    });
    if (!user || user.twoStepOtp !== otp)
      throw new BadRequestException("Invalid OTP");

    user.isTwoStepEnabled = true;
    user.twoStepOtp = undefined as unknown as string;
    await user.save();

    return successResponse({ res, message: "Two-step verification enabled" });
  };
}

export default new UserService();

import type { Request, Response } from "express";
import type {
  IConfirmEmailBodyInputsDTO,
  IForgotPasswordBodyInputsDTO,
  IGmailDTO,
  ILoginBodyInputsDTO,
  IResetForgotPasswordBodyInputsDTO,
  ISignupBodyInputsDTO,
  IVerifyForgotPasswordBodyInputsDTO,
} from "./auth.dto";
import { ProviderEnum, UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../utils/response/error.response";
import { compareHash, generatHash } from "../../utils/secuirty/hash.secuirty";
import { emailEvent } from "../../utils/email/email.event";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/secuirty/token.secuirty";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { successResponse } from "../../utils/response/success.response";
import { ILoginResponse } from "./auth.entities";
// import { customAlphabet } from "nanoid";

class AuthenticationService {
  private userModel = new UserRepository(UserModel);
  constructor() {}

  /**
   *
   * @param req -Express.Request
   * @param res -Express.Response
   * @returns Promise<Response>
   * @example ({ userName, email, password }: ISignupBodyInputsDTO)
   * return {message:"Done" , statusCode:201}
   */

  private verifyGoogleAccount = async (
    idToken: string
  ): Promise<TokenPayload> => {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID?.split(",") || [],
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException("fail to verify this google account");
    }
    return payload;
  };

  signup = async (req: Request, res: Response): Promise<Response> => {
    let { username, email, password }: ISignupBodyInputsDTO = req.body;

    const checkUserExist = await this.userModel.findOne({
      filter: { email },
      select: "email",
      options: {
        lean: true,
      },
    });
    if (checkUserExist) {
      throw new ConflictException("Email exist");
    }
    const otp = generateNumberOtp();
    // const otp = customAlphabet("0123456789" , 6)();

    const user = await this.userModel.createUser({
      data: [
        {
          username,
          email,
          password: await generatHash(password),
          confirmEmailOtp: await generatHash(String(otp)),
        },
      ],
    });

    user.save();

    emailEvent.emit("confirmEmail", { to: email, otp });

    return successResponse({
      res,
      message: "User created successfully",
      statusCode: 201,
    });
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: ILoginBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.system,
      },
    });

    if (!user) {
      throw new NotFoundException("Invalid login data");
    }

    if (!user.confirmAt) {
      throw new BadRequestException("Please verify your email first");
    }

    const isMatch = await compareHash(password, user.password);
    if (!isMatch) {
      throw new BadRequestException("Invalid login data");
    }

    const credentials = await createLoginCredentials(user);

    return successResponse<ILoginResponse>({
      res,
      message: "Login successful",
      data: { credentials },
    });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp }: IConfirmEmailBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmailOtp: { $exists: true },
        confirmAt: { $exists: false },
      },
    });
    if (!user) {
      throw new NotFoundException("Invalid account");
    }

    if (!(await compareHash(otp, user.confirmEmailOtp as string))) {
      throw new ConflictException("Invalid confirmation code");
    }
    await this.userModel.updateOne({
      filter: { email },
      update: {
        confirmAt: new Date(),
        $unset: { confirmEmailOtp: 1 },
      },
    });

    return successResponse({
      res,
      message: "Email verified successfully",
    });
  };

  sendForgotPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email }: IForgotPasswordBodyInputsDTO = req.body;
    const otp = generateNumberOtp();

    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmAt: { $exists: true },
        provider: ProviderEnum.system,
      },
    });

    if (!user) {
      throw new NotFoundException("Invalid account");
    }

    const result = await this.userModel.updateOne({
      filter: {
        email,
      },
      update: {
        resetPasswordOtp: await generatHash(String(otp)),
      },
    });
    if (!result.matchedCount) {
      throw new BadRequestException("Fail to send reset code");
    }

    emailEvent.emit("resetPassword", {
      to: email,
      otp,
    });

    return successResponse({
      res,
      message: "OTP sent successfully",
    });
  };

  verifyForgotPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, otp }: IVerifyForgotPasswordBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        resetPasswordOtp: { $exists: true },
        provider: ProviderEnum.system,
      },
    });

    if (!user) {
      throw new NotFoundException("Invalid account");
    }

    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid OTP");
    }

    return successResponse({
      res,
      message: "OTP verified successfully",
    });
  };

  resetForgotPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, otp, password }: IResetForgotPasswordBodyInputsDTO =
      req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        resetPasswordOtp: { $exists: true },
        provider: ProviderEnum.system,
      },
    });

    if (!user) {
      throw new NotFoundException("Invalid account");
    }

    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid OTP");
    }

    const result = await this.userModel.updateOne({
      filter: { email },
      update: {
        $unset: { resetPasswordOtp: 1 },
        password: await generatHash(password),
        changeCredentialsTime: new Date(),
      },
    });
    if (!result.matchedCount) {
      throw new BadRequestException("Fail to  reset account password");
    }

    return successResponse({
      res,
      message: "Password reset successfully",
    });
  };

  signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: IGmailDTO = req.body;
    const { email, family_name, given_name, picture } =
      await this.verifyGoogleAccount(idToken);

    const user = await this.userModel.findOne({
      filter: {
        email,
      },
    });

    if (user) {
      if (user.provider === ProviderEnum.google) {
        return this.loginWithGmail(req, res);
      }
      throw new ConflictException("Email already exists");
    }

    const [newUser] =
      (await this.userModel.create({
        data: [
          {
            firstName: given_name as string,
            lastName: family_name as string,
            profileImage: picture as string,
            email: email as string,
            confirmAt: new Date(),
            provider: ProviderEnum.google,
          },
        ],
      })) || [];

    if (!newUser) {
      throw new BadRequestException("Fail to signup with gmail");
    }

    const credentials = await createLoginCredentials(newUser);

    return successResponse<ILoginResponse>({
      res,
      message: "User added successfully",
      statusCode: 201,
      data: { credentials },
    });
  };

  loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: IGmailDTO = req.body;
    const { email } = await this.verifyGoogleAccount(idToken);

    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.google,
      },
    });

    if (!user) {
      throw new NotFoundException("Invalid login data or provider");
    }

    const credentials = await createLoginCredentials(user);

    return successResponse<ILoginResponse>({
      res,
      message: "Login successful",
      data: { credentials },
    });
  };
}

export default new AuthenticationService();

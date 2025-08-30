import type { Request, Response } from "express";
import type {
  IConfirmEmailBodyInputsDTO,
  ILoginBodyInputsDTO,
  ISignupBodyInputsDTO,
} from "./auth.dto";
import { UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../utils/response/error.response";
import { compareHash, generatHash } from "../../utils/secuirty/hash.secuirty";
import { emailEvent } from "../../utils/events/email.event";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/secuirty/token.secuirty";
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

  // private verifyGoogleAccount = async ({
  //   idToken,
  // }: {
  //   idToken: string;
  // }): Promise<any> => {
  //   const client = new OAuth2Client();
  //   const ticket = await client.verifyIdToken({
  //     idToken,
  //     audience: process.env.WEB_CLIENT_ID!.split(","),
  //   });
  //   return ticket.getPayload();
  // };

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

    return res
      .status(201)
      .json({ message: "User created successfully", data: { user } });
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: ILoginBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({
      filter: { email },
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

    return res
      .status(200)
      .json({ message: "Login successful", data: { credentials } });
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

    return res.status(200).json({ message: "Email verified successfully" });
  };

  // sendForgotPassword = async (
  //   req: Request,
  //   res: Response
  // ): Promise<Response> => {
  //   const { email } = req.body;
  //   const otp = customAlphabet("0123456789", 6)();

  //   const hashedOtp = await generateHash({ plainText: otp });

  //   const user = await DBservice.findOneAndUpdate({
  //     model: this.userModel,
  //     filter: {
  //       email,
  //       confirmEmail: { $exists: true },
  //       deleteAt: { $exists: false },
  //       provider: providerEnum.system,
  //     },
  //     data: {
  //       ForgotPasswordOtp: hashedOtp,
  //     },
  //     options: { new: true },
  //   });

  //   if (!user) {
  //     throw new NotFoundException("Invalid account");
  //   }

  //   emailEvent.emit("sendForgotPassword", {
  //     to: email,
  //     subject: "Forgot Password",
  //     title: "Reset Password",
  //     otp,
  //   });

  //   return res.status(200).json({ message: "OTP sent successfully" });
  // };

  // verifyForgotPassword = async (
  //   req: Request,
  //   res: Response
  // ): Promise<Response> => {
  //   const { email, otp } = req.body;

  //   const user = await DBservice.findOne({
  //     model: this.userModel,
  //     filter: {
  //       email,
  //       confirmEmail: { $exists: true },
  //       deleteAt: { $exists: false },
  //       ForgotPasswordOtp: { $exists: true },
  //       provider: providerEnum.system,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException("Invalid account");
  //   }

  //   if (
  //     !(await compareHash({
  //       plainText: otp,
  //       hashValue: user.ForgotPasswordOtp,
  //     }))
  //   ) {
  //     throw new BadRequestException("Invalid OTP");
  //   }

  //   return res.status(200).json({ message: "OTP verified successfully" });
  // };

  // resetPassword = async (req: Request, res: Response): Promise<Response> => {
  //   const { email, otp, password } = req.body;

  //   const user = await DBservice.findOne({
  //     model: this.userModel,
  //     filter: {
  //       email,
  //       confirmEmail: { $exists: true },
  //       deleteAt: { $exists: false },
  //       ForgotPasswordOtp: { $exists: true },
  //       provider: providerEnum.system,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException("Invalid account");
  //   }

  //   if (
  //     !(await compareHash({
  //       plainText: otp,
  //       hashValue: user.ForgotPasswordOtp,
  //     }))
  //   ) {
  //     throw new BadRequestException("Invalid OTP");
  //   }

  //   await DBservice.updateOne({
  //     model: this.userModel,
  //     filter: { email },
  //     data: {
  //       password: await generateHash({ plainText: password }),
  //       changeCredentialsTime: new Date(),
  //     },
  //   });

  //   return res.status(200).json({ message: "Password reset successfully" });
  // };

  // signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
  //   const { idToken } = req.body;
  //   const { email, email_verified, picture, name } =
  //     await this.verifyGoogleAccount({ idToken });

  //   if (!email_verified) {
  //     throw new BadRequestException("Not verified account");
  //   }

  //   const user = await DBservice.findOne({
  //     model: this.userModel,
  //     filter: { email },
  //   });

  //   if (user) {
  //     if (user.provider === providerEnum.google) {
  //       return this.loginWithGmail(req, res);
  //     }
  //     throw new ConflictException("Email already exists");
  //   }

  //   const [newUser] = await DBservice.create({
  //     model: this.userModel,
  //     data: [
  //       {
  //         fullName: name,
  //         email,
  //         picture,
  //         confirmEmail: Date.now(),
  //         provider: providerEnum.google,
  //       },
  //     ],
  //   });

  //   const credentials = await generateLoginCreadentials({ user: newUser });

  //   return res.status(201).json({
  //     message: "User added successfully",
  //     data: { credentials },
  //   });
  // };

  // loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
  //   const { idToken } = req.body;
  //   const { email, email_verified } = await this.verifyGoogleAccount({
  //     idToken,
  //   });

  //   if (!email_verified) {
  //     throw new BadRequestException("Not verified account");
  //   }

  //   const user = await DBservice.findOne({
  //     model: this.userModel,
  //     filter: { email, provider: providerEnum.google },
  //   });

  //   if (!user) {
  //     throw new NotFoundException("Invalid login data or provider");
  //   }

  //   const credentials = await generateLoginCreadentials({ user });

  //   return res.status(200).json({
  //     message: "Login successful",
  //     data: { credentials },
  //   });
  // };
}

export default new AuthenticationService();

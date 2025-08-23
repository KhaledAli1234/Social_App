import type { Request, Response } from "express";
import type { ILoginBodyInputsDTO, ISignupBodyInputsDTO } from "./auth.dto";
import { UserModel } from "../../DB/models/User.model";
import { sendEmail } from "../../utils/email/send.email";
import { BadRequestException } from "../../utils/response/error.response";
import { customAlphabet } from "nanoid";

class AuthenticationService {
  constructor() {}

  /**
   *
   * @param req -Express.Request
   * @param res -Express.Response
   * @returns Promise<Response>
   * @example ({ userName, email, password }: ISignupBodyInputsDTO)
   * return {message:"Done" , statusCode:201}
   */

  signup = async (req: Request, res: Response): Promise<Response> => {
    let { userName, email, password }: ISignupBodyInputsDTO = req.body;
    const exist = await UserModel.findOne({ email });
    if (exist) {
      throw new BadRequestException("User already exists");
    }

   const verificationCode = customAlphabet("0123456789", 6)();


    const user = new UserModel({
      userName,
      email,
      password,
      verificationCode,
    });

    await user.save();

    await sendEmail({
      to: email,
      subject: "Confirm your account",
      html: `<p>Your code: <b>${verificationCode}</b></p>`,
    });

    return res
      .status(200)
      .json({ message: "User created successfully", data: req.body });
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: ILoginBodyInputsDTO = req.body;

    const user = await UserModel.findOne({ email, password });
    if (!user) {
      throw new BadRequestException("Invalid credentials");
    }

    if (!user.isVerified) {
      throw new BadRequestException("Please verify your email first");
    }

    return res
      .status(200)
      .json({ message: "Login successful", data: req.body });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, code } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException("Invalid verification code");
    }

    user.isVerified = true;
    user.verificationCode = "";
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  };
}

export default new AuthenticationService();

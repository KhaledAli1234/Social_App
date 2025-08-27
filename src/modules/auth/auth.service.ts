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
    throw new NotFoundException("Account not found");
  }

  if (!user.confirmAt) {
    throw new BadRequestException("Please verify your email first");
  }

  const isMatch = await compareHash(password, user.password);
  if (!isMatch) {
    throw new BadRequestException("Invalid credentials");
  }

    return res
      .status(200)
      .json({ message: "Login successful" });
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
}

export default new AuthenticationService();

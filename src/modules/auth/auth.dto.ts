import * as validators from "./auth.validation";
import { z } from "zod";

// export interface ISignupBodyInputsDTO {
//   userName: string;
//   email: string;
//   password: string;
// }

export type ISignupBodyInputsDTO = z.Infer<typeof validators.signup.body>;
export type ILoginBodyInputsDTO = z.Infer<typeof validators.login.body>;
export type IConfirmEmailBodyInputsDTO = z.Infer<typeof validators.confirmEmail.body>;
export type IForgotPasswordBodyInputsDTO = z.Infer<typeof validators.sendForgotPassword.body>;
export type IVerifyForgotPasswordBodyInputsDTO = z.Infer<typeof validators.verifyForgotPassword.body>;
export type IResetForgotPasswordBodyInputsDTO = z.Infer<typeof validators.resetForgotPassword.body>;
export type IGmailDTO = z.Infer<typeof validators.signupWithGmail.body>;

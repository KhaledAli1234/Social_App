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

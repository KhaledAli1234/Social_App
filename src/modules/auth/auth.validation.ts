import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";

export const login = {
  body: z
    .strictObject({
      email: generalFields.email,
      password:generalFields.password, 
    })
};

export const confirmEmail = {
  body: z
    .strictObject({
      email: generalFields.email,
      otp:generalFields.otp, 
    })
};


export const signup = {
  body: login.body.extend({
      username: generalFields.username,
      confirmPassword: generalFields.confirmPassword,
    })
    .superRefine((data, ctx) => {
      if (data.confirmPassword !== data.password) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "password missMatch confirmPassword",
        });
      }
    }),
};

import { z } from "zod";
import { LogoutEnum } from "../../utils/secuirty/token.secuirty";
import { Types } from "mongoose";

export const logout = {
  body: z.strictObject({
    flag: z.enum(LogoutEnum).default(LogoutEnum.only),
  }),
};

export const freezeAccount = {
  params: z
    .object({
      userId: z.string().optional(),
    })
    .optional()
    .refine(
      (data) => {
        return data?.userId ? Types.ObjectId.isValid(data.userId) : true;
      },
      {
        error: "invalid objectId format",
        path: ["userId"],
      }
    ),
};


export const restoreAccount = {
  params: z
    .object({
      userId: z.string(),
    })
    .refine(
      (data) => {
        return Types.ObjectId.isValid(data.userId);
      },
      {
        error: "invalid objectId format",
        path: ["userId"],
      }
    ),
};

export const hardDelete = restoreAccount
import { z } from "zod";
import { LogoutEnum } from "../../utils/secuirty/token.secuirty";
import { Types } from "mongoose";
import { generalFields } from "../../middleware/validation.middleware";
import { RoleEnum } from "../../DB";

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

export const hardDelete = restoreAccount;

export const updatePassword = {
  body: z
    .strictObject({
      oldPassword: z.string().min(6),
      newPassword: z.string().min(6),
      confirmPassword: generalFields.confirmPassword,
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
      path: ["newPassword"],
      message: "New password must be different from old password",
    }),
};

export const sendFriendRequest = {
  params: z.strictObject({
    userId: generalFields.id,
  }),
};

export const acceptFriendRequest = {
  params: z.strictObject({
    requestId: generalFields.id,
  }),
};

export const changeRole = {
  params: sendFriendRequest.params,
  body: z.strictObject({
    role: z.enum(RoleEnum),
  }),
};

export const updateBasicInfo = {
  body: z.strictObject({
    username: generalFields.username.optional(),
    phone: generalFields.phone.optional(),
  }),
};

export const updateEmail = {
  body: z.strictObject({
    newEmail: generalFields.email,
  }),
};

export const confirmEmail = {
  body: z.strictObject({
    otp: generalFields.otp,
  }),
};

export const confirmTwoStep = {
  body: z.strictObject({
    otp: generalFields.otp,
  }),
};

export const deleteFriendRequest = {
  params: acceptFriendRequest.params,
};

export const unFriend = {
  params: z.strictObject({
    friendId: generalFields.id,
  }),
};

export const blockUser = {
  params: sendFriendRequest.params,
};

import { z } from "zod";
import {
  AllowCommentsEnum,
  AvailabilityEnum,
  LikeActionEnum,
} from "../../DB/models/Post.model";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const createPost = {
  body: z
    .strictObject({
      content: z.string().min(2).max(500000).optional(),
      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(2)
        .optional(),
      availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
      allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
      tags: z.array(generalFields.id).max(10).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.attachments?.length && !data.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "sorry we cannot make post without content or attachments",
        });
      }
      if (
        data.tags?.length &&
        data.tags.length !== [...new Set(data.tags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "duplicated tagged users",
        });
      }
    }),
};

export const updatePost = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().min(2).max(500000).optional(),
      availability: z.enum(AvailabilityEnum).optional(),
      allowComments: z.enum(AllowCommentsEnum).optional(),

      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(2)
        .optional(),
      removedAttachments: z.array(z.string()).max(2).optional(),
      tags: z.array(generalFields.id).max(10).optional(),
      removedTags: z.array(generalFields.id).max(10).optional(),
    })
    .superRefine((data, ctx) => {
      if (!Object.values(data)?.length) {
        ctx.addIssue({
          code: "custom",
          message: "all fields are empty",
        });
      }
      if (
        data.tags?.length &&
        data.tags.length !== [...new Set(data.tags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "duplicated tagged users",
        });
      }
      if (
        data.removedTags?.length &&
        data.removedTags.length !== [...new Set(data.removedTags)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["removedTags"],
          message: "duplicated removedTage users",
        });
      }
    }),
};

export const likePost = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  query: z.strictObject({
    action: z.enum(LikeActionEnum).default(LikeActionEnum.like),
  }),
};

export const sendTagEmail = {
  body: z.strictObject({
    postId: generalFields.id,
    removedTags: z.array(generalFields.id).min(1).max(10),
  }),
};

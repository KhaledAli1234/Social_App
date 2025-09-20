import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const createComment = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().min(2).max(500000).optional(),
      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(2)
        .optional(),
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

export const replyOnComment = {
  params: createComment.params.extend({
    commentId: generalFields.id,
    postId: generalFields.id,
  }),

  body: createComment.body,
};

export const getCommentById = {
  params: z.strictObject({
    commentId: generalFields.id,
    postId: generalFields.id,
  }),
};

export const getCommentWithReply = {
  params: getCommentById.params,
};

export const freezeComment = {
  params: getCommentById.params,
};

export const hardDeleteComment = {
  params: getCommentById.params,
};

export const updateComment = {
  params: getCommentById.params,
  body: createComment.body,
};

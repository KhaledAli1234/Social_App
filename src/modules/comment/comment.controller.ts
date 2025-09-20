import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import {
  cloudFileUploud,
  fileValidation,
} from "../../utils/multer/cloud.multer";
import * as validators from "./comment.validation";
import { validation } from "../../middleware/validation.middleware";
import commentService from "./comment.service";

const router = Router({ mergeParams: true });

router.get(
  "/:commentId",
  authentication(),
  validation(validators.getCommentById),
  commentService.getCommentById
);

router.get(
  "/:commentId/comment-with-reply",
  authentication(),
  validation(validators.getCommentWithReply),
  commentService.getCommentWithReply
);

router.post(
  "/",
  authentication(),
  cloudFileUploud({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.createComment),
  commentService.createComment
);

router.post(
  "/:commentId/reply",
  authentication(),
  cloudFileUploud({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.replyOnComment),
  commentService.replyOnComment
);

router.patch(
  "/:commentId",
  authentication(),
  validation(validators.updateComment),
  commentService.updateComment
);

router.patch(
  "/:commentId/freeze",
  authentication(),
  validation(validators.freezeComment),
  commentService.freezeComment
);

router.delete(
  "/:commentId/hard-delete",
  authentication(),
  validation(validators.hardDeleteComment),
  commentService.hardDeleteComment
);


export default router;

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


export default router;

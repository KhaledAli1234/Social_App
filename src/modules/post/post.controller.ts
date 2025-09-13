import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import postService from "./post.service";
import {
  cloudFileUploud,
  fileValidation,
} from "../../utils/multer/cloud.multer";
import * as validators from "./post.validation";
import { validation } from "../../middleware/validation.middleware";

const router = Router();

router.post(
  "/",
  authentication(),
  cloudFileUploud({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.createPost),
  postService.createPost
);

router.patch(
  "/:postId/like",
  authentication(),
  validation(validators.likePost),
  postService.likePost
);

export default router;

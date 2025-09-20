import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import { postService } from "./post.service";
import {
  cloudFileUploud,
  fileValidation,
} from "../../utils/multer/cloud.multer";
import * as validators from "./post.validation";
import { validation } from "../../middleware/validation.middleware";
import { commentRouter } from "../comment";

const router = Router();

router.use("/:postId/comment", commentRouter);

router.get("/", authentication(), postService.postList);

router.get(
  "/:postId",
  authentication(),
  validation(validators.getPostById),
  postService.getPostById
);

router.post(
  "/",
  authentication(),
  cloudFileUploud({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.createPost),
  postService.createPost
);

router.patch(
  "/:postId",
  authentication(),
  cloudFileUploud({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.updatePost),
  postService.updatePost
);

router.patch(
  "/:postId/like",
  authentication(),
  validation(validators.likePost),
  postService.likePost
);

router.patch(
  "/:postId/freeze",
  authentication(),
  validation(validators.freezePost),
  postService.freezePost
);

router.delete(
  "/:postId/hard-delete",
  authentication(),
  validation(validators.hardDeletePost),
  postService.hardDeletePost
);

router.post(
  "/send-email",
  authentication(),
  validation(validators.sendTagEmail),
  postService.sendTagEmail
);

export default router;

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

router.use("/:postId/comment" , commentRouter)

router.get("/", authentication(), postService.postList);

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

router.post(
  "/send-email",
  authentication(),
  validation(validators.sendTagEmail),
  postService.sendTagEmail
);

export default router;

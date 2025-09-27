import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import * as validators from "./chat.validation";
import { validation } from "../../middleware/validation.middleware";
import { ChatService } from "./chat.service";
import {
  cloudFileUploud,
  fileValidation,
} from "../../utils/multer/cloud.multer";

const router = Router({ mergeParams: true });
const chatService: ChatService = new ChatService();

router.get(
  "/",
  authentication(),
  validation(validators.getChat),
  chatService.getChat
);

router.get(
  "/group/:groupId",
  authentication(),
  validation(validators.getChattingGroup),
  chatService.getChattingGroup
);

router.post(
  "/group",
  authentication(),
  cloudFileUploud({ validation: fileValidation.image }).single("attachment"),
  validation(validators.createChattingGroup),
  chatService.createChattingGroup
);

export default router;

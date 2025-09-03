import { Router } from "express";
import userService from "./user.service";
import { authentication } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation";
import { TokenEnum } from "../../utils/secuirty/token.secuirty";
import { cloudFileUploud, fileValidation, StorageEnum } from "../../utils/multer/cloud.multer";


const router = Router();

router.get("/", authentication(), userService.profile);
router.patch("/profile-image", authentication(), cloudFileUploud({validation:fileValidation.image , storageApproach :StorageEnum.disk}).single("image"), userService.profileImage);
router.patch("/profile-cover-image", authentication(), cloudFileUploud({validation:fileValidation.image , storageApproach :StorageEnum.disk}).array("images" , 2), userService.profileCoverImage);
router.post("/refresh-token", authentication(TokenEnum.refresh), userService.refreshToken);
router.post("/logout", authentication(), validation(validators.logout), userService.logout);

export default router;

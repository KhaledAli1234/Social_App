import { Router } from "express";
import userService from "./user.service";
import { authentication, authorization } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation";
import { TokenEnum } from "../../utils/secuirty/token.secuirty";
import { cloudFileUploud, fileValidation, StorageEnum } from "../../utils/multer/cloud.multer";
import { endpoint } from "./user.authorization";


const router = Router();

router.delete("{/:userId}/freeze-account", authentication(),validation(validators.freezeAccount), userService.freezeAccount)
router.delete("/:userId", authorization(endpoint.hardDelete),validation(validators.hardDelete), userService.hardDeleteAccount)
router.patch("/:userId/restore-account", authorization(endpoint.restoreAccount),validation(validators.restoreAccount), userService.restoreAccount)
router.get("/", authentication(), userService.profile);
router.get("/dashboard", authorization(endpoint.dashboard), userService.dashboard);
router.patch("/:userId/change-role",  authorization(endpoint.dashboard), validation(validators.changeRole), userService.changeRole);
router.post("/:userId/send-friend-request",  authentication(), validation(validators.sendFriendRequest), userService.sendFriendRequest);
router.patch("/accept-friend-request/:requestId",  authentication(), validation(validators.acceptFriendRequest), userService.acceptFriendRequest);
router.patch("/profile-image", authentication(), userService.profileImage);
router.patch("/profile-cover-image", authentication(), cloudFileUploud({validation:fileValidation.image , storageApproach :StorageEnum.disk}).array("images" , 2), userService.profileCoverImage);
router.post("/refresh-token", authentication(TokenEnum.refresh), userService.refreshToken);
router.post("/logout", authentication(), validation(validators.logout), userService.logout);
router.patch("/update-password", authentication(), validation(validators.updatePassword), userService.updatePassword);
router.patch("/update-basic-info", authentication(), validation(validators.updateBasicInfo), userService.updateBasicInfo);
router.post("/update-email/request", authentication(), validation(validators.updateEmail), userService.requestUpdateEmail);
router.post("/update-email/confirm", authentication(), validation(validators.confirmEmail), userService.confirmUpdateEmail);
router.post("/enable", authentication(), userService.enableTwoStep);
router.post("/confirm", authentication(), validation(validators.confirmTwoStep), userService.confirmEnableTwoStep);
router.delete("/requests/:requestId", authentication(), validation(validators.deleteFriendRequest), userService.deleteFriendRequest);
router.patch("/unfriend/:friendId", authentication(), validation(validators.unFriend), userService.unFriend);
router.patch("/block/:userId", authentication(), validation(validators.blockUser), userService.blockUser);
export default router;

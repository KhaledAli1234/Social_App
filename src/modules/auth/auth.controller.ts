import { Router } from "express";
import authService from "./auth.service";
import * as validators from "./auth.validation";
import { validation } from "../../middleware/validation.middleware";

const router = Router();

router.post("/signup", validation(validators.signup), authService.signup);
router.post("/signup-gmail", validation(validators.signupWithGmail), authService.signupWithGmail);
router.post("/login", validation(validators.login), authService.login);
router.post("/login-gmail", validation(validators.signupWithGmail), authService.loginWithGmail);
router.patch("/confirm-Email", validation(validators.confirmEmail), authService.confirmEmail);
router.patch("/send-forgot-password", validation(validators.sendForgotPassword), authService.sendForgotPassword);
router.patch("/verify-forgot-password", validation(validators.verifyForgotPassword), authService.verifyForgotPassword);
router.patch("/reset-forgot-password", validation(validators.resetForgotPassword), authService.resetForgotPassword);

export default router;

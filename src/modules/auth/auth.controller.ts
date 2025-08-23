import { Router } from "express";
import authService from "./auth.service";
import * as validators from "./auth.validation";
import { validation } from "../../middleware/validation.middleware";

const router = Router();

router.post("/signup", validation(validators.signup), authService.signup);
router.post("/login", validation(validators.login), authService.login);
router.patch("/confirm-Email", authService.confirmEmail);

export default router;

import { Router } from "express";
import { requireSignIn } from "../../middleware/auth.js";
import { getMe, onboard } from "./user.controller.js";

const router = Router();

router.get("/me", requireSignIn, getMe);
router.post("/onboard", requireSignIn, onboard);

export default router;
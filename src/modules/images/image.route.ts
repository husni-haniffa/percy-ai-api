import { Router } from "express";
import { requireSignIn } from "../../middleware/auth.js";
import { presign, rollback } from "./image.controller.js";


const router = Router();

router.post("/presign", requireSignIn, presign);
router.post("/rollback", requireSignIn, rollback);

export default router;
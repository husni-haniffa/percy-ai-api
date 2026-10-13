import { Router } from "express";
import { requireSignIn } from "../../middleware/auth.js";
import { canCreate, create, mine } from "./listing.controller.js";

const router = Router();

router.get("/can-create", requireSignIn, canCreate);
router.get("/mine", requireSignIn, mine);
router.post("/", requireSignIn, create);

export default router;
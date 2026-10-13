import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import { pending, approve, reject, reindex, listAll, remove, restore } from "./admin.controller.js";

const router = Router();

router.use(requireAdmin);

router.get("/listings/pending", pending);
router.post("/listings/:id/approve", approve);
router.post("/listings/:id/reject", reject);
router.post("/ai/reindex", reindex);
router.get("/listings", listAll);
router.post("/listings/:id/remove", remove);
router.post("/listings/:id/restore", restore);
export default router;
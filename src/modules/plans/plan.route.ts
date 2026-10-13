import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import { listPlans, editPlan } from "./plan.controller.js";

const router = Router();

router.get("/", requireAdmin, listPlans);
router.patch("/:id", requireAdmin, editPlan);

export default router;
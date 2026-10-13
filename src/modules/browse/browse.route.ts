import { Router } from "express";
import {
    properties,
    vehicles,
    detail,
    contact,
    inquiry,
} from "./browse.controller.js";

const router = Router();

router.get("/properties", properties);
router.get("/vehicles", vehicles);
router.get("/:id", detail);
router.post("/:id/contact", contact);
router.post("/:id/inquiry", inquiry);

export default router;
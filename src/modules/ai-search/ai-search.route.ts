import { Router } from "express";
import rateLimit from "express-rate-limit";
import { search } from "./ai-search.controller.js";

const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many searches. Please wait a minute and try again." },
});

const router = Router();

router.post("/", searchLimiter, search);

export default router;
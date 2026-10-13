import express from "express";
import cors from "cors";
import { clerkMiddleware, getAuth } from "@clerk/express";
import userRoutes from "./modules/users/user.route.js";
import planRoutes from "./modules/plans/plan.route.js";
import listingRoutes from "./modules/listings/listing.route.js";
import imageRoutes from "./modules/images/image.route.js";
import adminRoutes from "./modules/admin/admin.route.js";
import browseRoutes from "./modules/browse/browse.route.js";
import aiSearchRoutes from "./modules/ai-search/ai-search.route.js";
import { requireSignIn, requireAdmin } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectDB } from "./config/db.js";
import { requireEnv } from "./config/env.js";
import { seedDefaultPlan } from "./modules/plans/plan.service.js";


const app = express();
let initialization: Promise<void> | undefined;

app.set("trust proxy", 1);

app.use(cors({
    origin: ["http://localhost:3000", "https://percy-ai.vercel.app"],
    credentials: true,
}));

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", async (req, res, next) => {
    if (!initialization) {
        initialization = (async () => {
            requireEnv("CLERK_SECRET_KEY");
            await connectDB();
            await seedDefaultPlan();
        })().catch((error: unknown) => {
            initialization = undefined;
            throw error;
        });
    }

    try {
        await initialization;
        next();
    } catch (error) {
        next(error);
    }
});

app.use("/api", clerkMiddleware());

app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/browse", browseRoutes)
app.use("/api/ai-search", aiSearchRoutes);

app.get("/api/test/me", requireSignIn, (req, res) => {
    const { userId } = getAuth(req);
    res.json({ userId });
});

app.get("/api/test/admin", requireAdmin, (req, res) => {
    res.json({ message: "You are the admin" });
});

// 404 handler
app.use((req, res) => {
    console.warn("404 - Route not found:", req.method, req.path);
    res.status(404).json({ message: "Route not found", path: req.path });
});

app.use(errorHandler); 

export default app;
import { env } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { seedDefaultPlan } from "./modules/plans/plan.service.js";
import { removeExpiredVectors } from "./modules/ai-search/ai-search.service.js";

async function start() {
    await connectDB();
    await seedDefaultPlan();
    await removeExpiredVectors();
    setInterval(removeExpiredVectors, 60 * 60 * 1000);
    app.listen(env.port, () => console.log(`Server running on port ${env.port}`));
}

start();
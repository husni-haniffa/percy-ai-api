import mongoose from "mongoose";
import { env } from "./env.js";


export async function connectDB() {
    try {
        await mongoose.connect(env.mongoUri, {
            dbName: env.databaseName
        });
        console.log("MongoDB connected")
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}
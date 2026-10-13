import mongoose from "mongoose";
import { env, requireEnv } from "./env.js";

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    if (mongoose.connection.readyState !== 2) {
        connectionPromise = undefined;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(requireEnv("MONGODB_URI", env.mongoUri), {
            dbName: requireEnv("DATABASE_NAME", env.databaseName),
            serverSelectionTimeoutMS: 10_000,
            maxPoolSize: 10,
        }).then((connection) => {
            console.log("MongoDB connected");
            return connection;
        }).catch((error: unknown) => {
            connectionPromise = undefined;
            console.error("MongoDB connection failed:", error);
            throw error;
        });
    }

    return connectionPromise;
}
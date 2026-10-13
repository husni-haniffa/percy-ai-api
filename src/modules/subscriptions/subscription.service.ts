import mongoose from "mongoose";
import { Subscription } from "./subscription.model.js";

export async function createSubscription(
    userId: mongoose.Types.ObjectId,
    plan: { _id: mongoose.Types.ObjectId; durationDays: number }
) {
    const startedAt = new Date();
    const expiresAt = new Date(
        startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
    );

    return Subscription.create({
        user: userId,
        plan: plan._id,
        startedAt,
        expiresAt,
    });
}

// The current subscription is the most recent one
export async function getCurrentSubscription(userId: mongoose.Types.ObjectId) {
    return Subscription.findOne({ user: userId })
        .sort({ startedAt: -1 })
        .populate("plan");
}
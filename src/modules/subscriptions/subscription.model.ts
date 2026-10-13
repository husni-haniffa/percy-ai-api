import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
        startedAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

subscriptionSchema.index({ user: 1, startedAt: -1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
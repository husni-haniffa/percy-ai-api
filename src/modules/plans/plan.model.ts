import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        durationDays: { type: Number, required: true },
        maxListings: { type: Number, required: true },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Plan = mongoose.model("Plan", planSchema);
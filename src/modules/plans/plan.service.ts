import mongoose from "mongoose";
import { Plan } from "./plan.model.js";
import { AppError } from "../../lib/AppError.js";


export async function seedDefaultPlan() {
    const existing = await Plan.findOne({ isDefault: true });
    if (existing) return;

    await Plan.create({
        name: "Free",
        durationDays: 60,
        maxListings: 100,
        isDefault: true,
    });
    console.log("Free plan created");
}

export async function getDefaultPlan() {
    const plan = await Plan.findOne({ isDefault: true });
    if (!plan) {
        throw new AppError("Default plan is missing", 500);
    }
    return plan;
}

export async function getAllPlans() {
    return Plan.find().sort({ createdAt: 1 });
}

export async function updatePlan(
    id: string,
    data: { durationDays?: number; maxListings?: number }
) {
    if (!mongoose.isValidObjectId(id)) {
        throw new AppError("Invalid plan id", 400);
    }

    const plan = await Plan.findByIdAndUpdate(id, data, { new: true });
    if (!plan) {
        throw new AppError("Plan not found", 404);
    }
    return plan;
}
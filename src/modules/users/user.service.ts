import { clerkClient } from "@clerk/express";
import { User } from "./user.model.js";
import { AppError } from "../../lib/AppError.js";
import { getDefaultPlan } from "../plans/plan.service.js";
import { createSubscription } from "../subscriptions/subscription.service.js";


export async function getUserByClerkId(clerkId: string) {
    return User.findOne({ clerkId, isDeleted: false });
}

export async function createUser(clerkId: string, phone: string) {
    const existing = await User.findOne({ clerkId });
    if (existing) {
        throw new AppError("You are already registered", 409);
    }

    const clerkUser = await clerkClient.users.getUser(clerkId);

    const name =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "User";

    const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    if (!email) {
        throw new AppError("Your account has no email address", 400);
    }
    const plan = await getDefaultPlan(); // before creating the user, so a missing plan fails early
    const user = await User.create({
        clerkId,
        name,
        email,
        phone,
        termsAcceptedAt: new Date(),
    });
    await createSubscription(user._id, plan);

    return user
}

export async function getOnboardedUser(clerkId: string) {
    const user = await getUserByClerkId(clerkId);
    if (!user) {
        throw new AppError("Please complete your profile first", 403);
    }
    return user;
}
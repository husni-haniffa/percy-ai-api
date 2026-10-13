import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { onboardSchema, normalizePhone } from "./user.schema.js";
import { getUserByClerkId, createUser } from "./user.service.js";
import { AppError } from "../../lib/AppError.js";
import { getCurrentSubscription } from "../subscriptions/subscription.service.js";
import { validate } from "../../lib/validate.js";


export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const clerkId = getAuth(req).userId as string;
        const user = await getUserByClerkId(clerkId);

        if (!user) {
            return res.json({ onboarded: false });
        }
        const subscription = await getCurrentSubscription(user._id);
        return res.json({ onboarded: true, user, subscription });
    } catch (error) {
         next(error);
         return;
    }
}

export async function onboard(req: Request, res: Response, next: NextFunction) {
    try {
        const clerkId = getAuth(req).userId as string;

        const result = validate(
            onboardSchema,
            req.body,
            "Please enter your phone number and accept the Terms and Privacy Policy"
        );

        const phone = normalizePhone(result.phone);
        if (!phone) {
            throw new AppError(
                "Enter a valid Sri Lankan mobile number, like 0771234567 or +94771234567",
                400
            );
        }

        const user = await createUser(clerkId, phone);
        return res.status(201).json({ onboarded: true, user });
    } catch (error) {
        next(error);
        return;
    }
}
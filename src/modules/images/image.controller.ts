import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { presignSchema, rollbackSchema } from "./image.schema.js";
import { createUploadUrls, deleteTempImages } from "./image.service.js";
import { getOnboardedUser } from "../users/user.service.js";
import { AppError } from "../../lib/AppError.js";
import { validate } from "../../lib/validate.js";


export async function presign(req: Request, res: Response, next: NextFunction) {
    try {
        const clerkId = getAuth(req).userId as string;
        const user = await getOnboardedUser(clerkId);

        const result = validate(presignSchema, req.body);

        const tickets = await createUploadUrls(String(user._id), result.contentTypes);
        return res.json(tickets);
    } catch (error) {
        next(error);
        return;
    }
}

export async function rollback(req: Request, res: Response, next: NextFunction) {
    try {
        const clerkId = getAuth(req).userId as string;
        const user = await getOnboardedUser(clerkId);

        const result = validate(rollbackSchema, req.body);

        await deleteTempImages(String(user._id), result.keys);
        return res.json({ message: "Images removed" });
    } catch (error) {
        next(error);
        return;
    }
}
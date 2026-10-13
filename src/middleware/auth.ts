import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { AppError } from "../lib/AppError.js";


export function requireSignIn(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuth(req);
    if (!userId) {
        return next(new AppError("Please sign in to continue", 401));
    }
    next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
        return next(new AppError("Please sign in to continue", 401));
    }
    const role = (sessionClaims as any)?.metadata?.role;
    if (role !== "admin") {
        return next(new AppError("Admin access only", 403));
    }
    next();
}
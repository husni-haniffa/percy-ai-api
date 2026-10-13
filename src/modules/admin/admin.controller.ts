import { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/AppError.js";
import { validate } from "../../lib/validate.js";
import { rejectSchema, listQuerySchema } from "./admin.schema.js";
import { getPendingListings, approveListing, rejectListing, getAllListings, removeListing, restoreListing } from "./admin.service.js";
import { reindexAll } from "../ai-search/ai-search.service.js";


export async function pending(req: Request, res: Response, next: NextFunction) {
    try {
        return res.json(await getPendingListings());
    } catch (error) {
        next(error);
        return;
    }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
    try {
        const listing = await approveListing(String(req.params.id));
        return res.json(listing);
    } catch (error) {
        next(error);
        return;
    }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
    try {
        const result = validate(rejectSchema, req.body, "Please give a rejection reason (5 to 500 characters)");
        const reason = result.reason.trim();
        if (reason.length < 5) {
            throw new AppError("Please give a rejection reason (5 to 500 characters)", 400);
        }

        const listing = await rejectListing(String(req.params.id), reason);
        return res.json(listing);
    } catch (error) {
        next(error);
        return;
    }
}

export async function reindex(req: Request, res: Response, next: NextFunction) {
    try {
        return res.json(await reindexAll());
    } catch (error) {
        next(error);
        return;
    }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
    try {
        const result = validate(listQuerySchema, req.query);

        const page = Math.max(1, Number(result.page ?? 1));
        return res.json(await getAllListings(result.status ?? "all", page));
    } catch (error) {
        next(error);
        return;
    }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        const result = rejectSchema.safeParse(req.body); // same shape: { reason }
        const reason = result.success ? result.data.reason.trim() : "";
        if (reason.length < 5) {
            throw new AppError("Please give a reason (5 to 500 characters)", 400);
        }

        return res.json(await removeListing(String(req.params.id), reason));
    } catch (error) {
        next(error);
        return;
    }
}

export async function restore(req: Request, res: Response, next: NextFunction) {
    try {
        return res.json(await restoreListing(String(req.params.id)));
    } catch (error) {
        next(error);
        return;
    }
}
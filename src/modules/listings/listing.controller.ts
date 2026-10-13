import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { createListingSchema } from "./listing.schema.js";
import { getCanCreate, createListing, getMyListings } from "./listing.service.js";
import { AppError } from "../../lib/AppError.js";
import { validate } from "../../lib/validate.js";


export async function canCreate(req: Request, res: Response, next: NextFunction) {
    try {
        const clerkId = getAuth(req).userId as string;
        return res.json(await getCanCreate(clerkId));
    } catch (error) {
        next(error);
        return;
    }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const clerkId = getAuth(req).userId as string;

        const result = validate(createListingSchema, req.body);

        const listing = await createListing(clerkId, result);
        return res.status(201).json(listing);
    } catch (error) {
        next(error);
        return;
    }
}

export async function mine(req: Request, res: Response, next: NextFunction) {
    try {
        const clerkId = getAuth(req).userId as string;
        return res.json(await getMyListings(clerkId));
    } catch (error) {
        next(error);
        return;
    }
}
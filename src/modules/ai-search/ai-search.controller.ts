import { Request, Response, NextFunction } from "express";
import { searchSchema } from "./ai-search.schema.js";
import { searchListings } from "./ai-search.service.js";
import { AppError } from "../../lib/AppError.js";
import { validate } from "../../lib/validate.js";


export async function search(req: Request, res: Response, next: NextFunction) {
    try {
        const result = validate(
            searchSchema,
            req.body,
            "Please describe what you are looking for (3 to 300 characters)"
        );

        const query = result.query.trim();
        if (query.length < 3) {
            throw new AppError("Please describe what you are looking for (3 to 300 characters)", 400);
        }

        const items = await searchListings(query);
        return res.json({ query, items });
    } catch (error) {
        next(error);
        return;
    }
}
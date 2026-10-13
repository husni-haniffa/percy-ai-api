import { Request, Response, NextFunction } from "express";
import { updatePlanSchema } from "./plan.schema.js";
import { getAllPlans, updatePlan } from "./plan.service.js";
import { AppError } from "../../lib/AppError.js";
import { validate } from "../../lib/validate.js";


export async function listPlans(req: Request, res: Response, next: NextFunction) {
    try {
        const plans = await getAllPlans();
        return res.json(plans);
    } catch (error) {
        next(error);
        return;
    }
}

export async function editPlan(req: Request, res: Response, next: NextFunction) {
    try {
        const result = validate(
            updatePlanSchema,
            req.body,
            "Duration and max listings must be whole numbers greater than 0"
        );
        if (Object.keys(result).length === 0) {
            throw new AppError("Send durationDays or maxListings to update", 400);
        }

        const plan = await updatePlan(String(req.params.id), result);
        return res.json(plan);
    } catch (error) {
        next(error);
        return;
    }
}
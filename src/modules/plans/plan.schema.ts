import { z } from "zod";

export const updatePlanSchema = z.object({
    durationDays: z.number().int().positive().optional(),
    maxListings: z.number().int().positive().optional(),
}).passthrough();
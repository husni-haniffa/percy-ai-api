import { type } from "arktype";

export const updatePlanSchema = type({
    "durationDays?": "number.integer>0",
    "maxListings?": "number.integer>0",
});

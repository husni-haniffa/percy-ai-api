import { z } from "zod";

const integerString = z.string().regex(/^-?\d+$/);
const numericString = z.string().refine(
    (value) => value.trim() !== "" && Number.isFinite(Number(value)),
    "Must be numeric"
);

const commonQuery = z.object({
    purpose: z.enum(["sale", "rent"]).optional(),
    city: z.string().optional(),
    minPrice: numericString.optional(),
    maxPrice: numericString.optional(),
    page: integerString.optional(),
    limit: integerString.optional(),
});

export const propertyQuerySchema = commonQuery.extend({
    propertyType: z.enum(["house", "apartment", "land", "commercial"]).optional(),
    minBedrooms: integerString.optional(),
}).passthrough();

export const vehicleQuerySchema = commonQuery.extend({
    vehicleType: z.enum(["car", "van", "suv", "motorbike", "three-wheeler", "lorry"]).optional(),
    brand: z.string().optional(),
    fuel: z.enum(["petrol", "diesel", "hybrid", "electric"]).optional(),
    transmission: z.enum(["manual", "automatic"]).optional(),
    minYear: integerString.optional(),
    maxMileage: numericString.optional(),
}).passthrough();
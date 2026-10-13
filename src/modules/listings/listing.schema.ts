import { z } from "zod";

const baseListing = z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(2000),
    purpose: z.enum(["sale", "rent"]),
    price: z.number().positive(),
    city: z.string().min(2).max(50),
    images: z.array(z.string()).max(10),
}).passthrough();

const propertyListing = baseListing.extend({
    category: z.literal("property"),
    propertyType: z.enum(["house", "apartment", "land", "commercial"]),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    perches: z.number().positive().optional(),
});

const vehicleListing = baseListing.extend({
    category: z.literal("vehicle"),
    vehicleType: z.enum(["car", "van", "suv", "motorbike", "three-wheeler", "lorry"]),
    brand: z.string().min(1).max(50),
    code: z.string().min(1).max(50),
    year: z.number().int().min(1950),
    mileage: z.number().nonnegative(),
    transmission: z.enum(["manual", "automatic"]),
    fuel: z.enum(["petrol", "diesel", "hybrid", "electric"]),
});

export const createListingSchema = z.union([propertyListing, vehicleListing]);
export const updatePropertySchema = propertyListing.partial();
export const updateVehicleSchema = vehicleListing.partial();
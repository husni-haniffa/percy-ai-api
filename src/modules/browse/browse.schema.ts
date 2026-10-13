import { type } from "arktype";

const integerString = type("string").narrow((value) => /^-?\d+$/.test(value));
const numericString = type("string").narrow(
    (value) => value.trim() !== "" && Number.isFinite(Number(value))
);

const commonQuery = {
    "purpose?": "'sale' | 'rent'",
    "city?": "string",
    "minPrice?": numericString,
    "maxPrice?": numericString,
    "page?": integerString,
    "limit?": integerString,
} as const;

export const propertyQuerySchema = type.merge(commonQuery, {
    "propertyType?": "'house' | 'apartment' | 'land' | 'commercial'",
    "minBedrooms?": integerString,
});

export const vehicleQuerySchema = type.merge(commonQuery, {
    "vehicleType?": "'car' | 'van' | 'suv' | 'motorbike' | 'three-wheeler' | 'lorry'",
    "brand?": "string",
    "fuel?": "'petrol' | 'diesel' | 'hybrid' | 'electric'",
    "transmission?": "'manual' | 'automatic'",
    "minYear?": integerString,
    "maxMileage?": numericString,
});

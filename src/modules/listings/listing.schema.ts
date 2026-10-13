import { type } from "arktype";

const baseListing = {
    title: type("string>=3").narrow((title) => title.length <= 100),
    description: type("string>=10").narrow((description) => description.length <= 2000),
    purpose: "'sale' | 'rent'",
    price: "number>0",
    city: type("string>=2").narrow((city) => city.length <= 50),
    images: type("string[]").narrow((images) => images.length <= 10),
} as const;

const propertyListing = type.merge(baseListing, {
    category: "'property'",
    propertyType: "'house' | 'apartment' | 'land' | 'commercial'",
    "bedrooms?": "number.integer>=0",
    "bathrooms?": "number.integer>=0",
    "perches?": "number>0",
});

const vehicleListing = type.merge(baseListing, {
    category: "'vehicle'",
    vehicleType: "'car' | 'van' | 'suv' | 'motorbike' | 'three-wheeler' | 'lorry'",
    brand: type("string>=1").narrow((brand) => brand.length <= 50),
    code: type("string>=1").narrow((code) => code.length <= 50),
    year: "number.integer>=1950",
    mileage: "number>=0",
    transmission: "'manual' | 'automatic'",
    fuel: "'petrol' | 'diesel' | 'hybrid' | 'electric'",
});

export const createListingSchema = type.or(propertyListing, vehicleListing);
export const updatePropertySchema = propertyListing.partial();
export const updateVehicleSchema = vehicleListing.partial();

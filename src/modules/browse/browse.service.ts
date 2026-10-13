import mongoose from "mongoose";
import {
    Listing,
    PropertyListing,
    VehicleListing,
} from "../listings/listing.model.js";
import { AppError } from "../../lib/AppError.js";


// Hidden from the public
export const publicFields =
    "-owner -views -inquiries -contactInfoViews -rejectionReason -removalReason -isDeleted -__v";

// The one definition of "visible to customers"
export function activeFilter() {
    return {
        status: "approved" as const,
        isDeleted: false,
        expiresAt: { $gt: new Date() },
    };
}

function toNumber(value?: string) {
    return value === undefined ? undefined : Number(value);
}

// Case-insensitive exact match, so "negombo" finds "Negombo"
function exactText(value: string) {
    const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped}$`, "i");
}

function addRange(
    filter: Record<string, any>,
    field: string,
    min?: number,
    max?: number
) {
    if (min === undefined && max === undefined) return;
    filter[field] = {};
    if (min !== undefined) filter[field].$gte = min;
    if (max !== undefined) filter[field].$lte = max;
}

function buildCommonFilter(query: {
    purpose?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
}) {
    const filter: Record<string, any> = { ...activeFilter() };

    if (query.purpose) filter.purpose = query.purpose;
    if (query.city) filter.city = exactText(query.city);
    addRange(filter, "price", toNumber(query.minPrice), toNumber(query.maxPrice));

    return filter;
}

async function runSearch(
    model: any,
    filter: Record<string, any>,
    page?: string,
    limit?: string
) {
    const pageNumber = Math.max(1, toNumber(page) ?? 1);
    const limitNumber = Math.min(50, Math.max(1, toNumber(limit) ?? 12));

    const [items, total] = await Promise.all([
        model
            .find(filter)
            .select(publicFields)
            .sort({ approvedAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber),
        model.countDocuments(filter),
    ]);

    return {
        items,
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
    };
}

export async function searchProperties(query: {
    purpose?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
    limit?: string;
    propertyType?: string;
    minBedrooms?: string;
}) {
    const filter = buildCommonFilter(query);

    if (query.propertyType) filter.propertyType = query.propertyType;
    if (query.minBedrooms) filter.bedrooms = { $gte: Number(query.minBedrooms) };

    console.log('Property filter:', JSON.stringify(filter));
    const result = await runSearch(PropertyListing, filter, query.page, query.limit);
    console.log('Property search result:', { total: result.total, items: result.items.length });
    return result;
}

export async function searchVehicles(query: {
    purpose?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
    limit?: string;
    vehicleType?: string;
    brand?: string;
    fuel?: string;
    transmission?: string;
    minYear?: string;
    maxMileage?: string;
}) {
    const filter = buildCommonFilter(query);

    if (query.vehicleType) filter.vehicleType = query.vehicleType;
    if (query.brand) filter.brand = exactText(query.brand);
    if (query.fuel) filter.fuel = query.fuel;
    if (query.transmission) filter.transmission = query.transmission;
    if (query.minYear) filter.year = { $gte: Number(query.minYear) };
    if (query.maxMileage) filter.mileage = { $lte: Number(query.maxMileage) };

    console.log('Vehicle filter:', JSON.stringify(filter));
    const result = await runSearch(VehicleListing, filter, query.page, query.limit);
    console.log('Vehicle search result:', { total: result.total, items: result.items.length });
    return result;
}

function checkId(listingId: string) {
    if (!mongoose.isValidObjectId(listingId)) {
        throw new AppError("Listing not found", 404);
    }
}

// One query both finds the listing and adds 1 to a counter
export async function getListingDetail(listingId: string) {
    checkId(listingId);

    const listing = await Listing.findOneAndUpdate(
        { _id: listingId, ...activeFilter() },
        { $inc: { views: 1 } },
        { new: true }
    ).select(publicFields);

    if (!listing) {
        throw new AppError("Listing not found", 404);
    }
    return listing;
}

export async function getContactInfo(listingId: string) {
    checkId(listingId);

    const listing = await Listing.findOneAndUpdate(
        { _id: listingId, ...activeFilter() },
        { $inc: { contactInfoViews: 1 } }
    ).populate("owner", "name email phone");

    if (!listing) {
        throw new AppError("Listing not found", 404);
    }

    const owner = listing.owner as any;
    return { name: owner.name, phone: owner.phone, email: owner.email };
}

export async function recordInquiry(listingId: string) {
    checkId(listingId);

    const result = await Listing.updateOne(
        { _id: listingId, ...activeFilter() },
        { $inc: { inquiries: 1 } }
    );

    if (result.matchedCount === 0) {
        throw new AppError("Listing not found", 404);
    }
}
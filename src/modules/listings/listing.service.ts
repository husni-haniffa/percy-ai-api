import { Listing, PropertyListing, VehicleListing } from "./listing.model.js";
import { getOnboardedUser } from "../users/user.service.js";
import { getCurrentSubscription } from "../subscriptions/subscription.service.js";
import { AppError } from "../../lib/AppError.js";
import mongoose from "mongoose";
import type { z } from "zod";
import { promoteImages, keyToUrl, deleteKeys, urlsToKeys } from "../images/image.service.js";
import {
    createListingSchema,
    updatePropertySchema,
    updateVehicleSchema,
} from "./listing.schema.js";
import { removeFromIndex } from "../ai-search/ai-search.service.js";
import { validate } from "../../lib/validate.js";

// Shared by the pre-check and the real create
async function checkLimits(user: { _id: any }) {
    const subscription = await getCurrentSubscription(user._id);
    if (!subscription) {
        throw new AppError("No plan found for your account", 403);
    }

    const maxListings = (subscription.plan as any).maxListings as number;
    const now = new Date();

    const used = await Listing.countDocuments({
        owner: user._id,
        isDeleted: false,
        $or: [
            { status: "pending" },
            { status: "approved", expiresAt: { $gt: now } },
        ],
    });

    if (subscription.expiresAt < now) {
        return { canCreate: false, reason: "Your plan has expired", used, maxListings };
    }
    if (used >= maxListings) {
        return {
            canCreate: false,
            reason: `You have reached the limit of ${maxListings} listings`,
            used,
            maxListings,
        };
    }
    return { canCreate: true, reason: null, used, maxListings };
}

export async function getCanCreate(clerkId: string) {
    const user = await getOnboardedUser(clerkId);
    return checkLimits(user);
}

export async function createListing(
    clerkId: string,
    data: z.output<typeof createListingSchema>
) {
    const user = await getOnboardedUser(clerkId);

    const limits = await checkLimits(user);
    if (!limits.canCreate) {
        throw new AppError(limits.reason as string, 403);
    }

    // We make the id first, so the images can go in the listing's own folder
    const listingId = new mongoose.Types.ObjectId();
    const tempKeys = [...new Set(data.images)];

    const newKeys = await promoteImages(String(user._id), String(listingId), tempKeys);

    const fields = {
        ...data,
        _id: listingId,
        images: newKeys.map(keyToUrl),
        owner: user._id,
        status: "pending" as const,
    };

    try {
        const listing =
            data.category === "property"
                ? await PropertyListing.create(fields)
                : await VehicleListing.create(fields);

        await deleteKeys(tempKeys); // success: clear the temp copies
        return listing;
    } catch (error) {
        await deleteKeys(newKeys); // failure: remove the copies we made
        throw error;
    }
}

export async function getMyListings(clerkId: string) {
    const user = await getOnboardedUser(clerkId);
    return Listing.find({ owner: user._id, isDeleted: false }).sort({ createdAt: -1 });
}

async function findOwnListing(userId: any, listingId: string) {
    if (!mongoose.isValidObjectId(listingId)) {
        throw new AppError("Listing not found", 404);
    }

    // Someone else's listing looks the same as a missing one: 404
    const listing = await Listing.findOne({
        _id: listingId,
        owner: userId,
        isDeleted: false,
    });
    if (!listing) {
        throw new AppError("Listing not found", 404);
    }
    return listing;
}

async function requireActivePlan(user: { _id: any }) {
    const subscription = await getCurrentSubscription(user._id);
    if (!subscription || subscription.expiresAt < new Date()) {
        throw new AppError("Your plan has expired", 403);
    }
}

export async function updateListing(
    clerkId: string,
    listingId: string,
    body: unknown
) {
    const user = await getOnboardedUser(clerkId);
    await requireActivePlan(user);

    const listing = await findOwnListing(user._id, listingId);
    if (listing.status === "removed") {
        throw new AppError("This listing was removed by an admin and can't be edited", 403);
    }
    const isExpired =
        listing.status === "approved" &&
        listing.expiresAt &&
        listing.expiresAt <= new Date();
    if (isExpired) {
        throw new AppError("Expired listings cannot be edited", 403);
    }

    const schema: typeof updatePropertySchema | typeof updateVehicleSchema =
        listing.get("category") === "property"
            ? updatePropertySchema
            : updateVehicleSchema;

    const result = validate(schema, body);
    if (Object.keys(result).length === 0) {
        throw new AppError("Nothing to update", 400);
    }

    const { images: finalImages, ...otherFields } = result;

    // Image handling: keep the old ones that are still listed, add the new ones
    const oldUrls = [...listing.images];
    let tempKeys: string[] = [];
    let newKeys: string[] = [];

    if (finalImages) {
        const finalList = [...new Set(finalImages)];

        tempKeys = finalList.filter((item) => !oldUrls.includes(item));
        newKeys = await promoteImages(String(user._id), String(listing._id), tempKeys);

        let next = 0;
        listing.images = finalList.map((item) =>
            oldUrls.includes(item) ? item : keyToUrl(newKeys[next++])
        );
    }

    listing.set(otherFields);
    listing.status = "pending"; // back to the admin
    listing.rejectionReason = undefined;

    try {
        await listing.save();
        await removeFromIndex(listing._id); // hidden until re-approved, so not searchable
    } catch (error) {
        await deleteKeys(newKeys); // save failed: remove the copies we made
        throw error;
    }

    // Save worked: delete removed images and the temp originals
    const removedUrls = oldUrls.filter((url) => !listing.images.includes(url));
    await deleteKeys([...urlsToKeys(removedUrls), ...tempKeys]);

    return listing;
}

export async function deleteListing(clerkId: string, listingId: string) {
    const user = await getOnboardedUser(clerkId);
    const listing = await findOwnListing(user._id, listingId);

    listing.isDeleted = true;
    await listing.save();
    await removeFromIndex(listing._id); // hidden until re-approved, so not searchable
}
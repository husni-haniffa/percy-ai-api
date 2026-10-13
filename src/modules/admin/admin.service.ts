import mongoose from "mongoose";
import { AppError } from "../../lib/AppError.js";
import { indexListing, removeFromIndex } from "../ai-search/ai-search.service.js";
import { Listing } from "../listings/listing.model.js";
import { getCurrentSubscription } from "../subscriptions/subscription.service.js";

const LISTING_DURATION_DAYS = 60;

async function findPendingListing(listingId: string) {
    if (!mongoose.isValidObjectId(listingId)) {
        throw new AppError("Listing not found", 404);
    }

    const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
    if (!listing) {
        throw new AppError("Listing not found", 404);
    }
    if (listing.status !== "pending") {
        throw new AppError("Only pending listings can be reviewed", 409);
    }
    return listing;
}

export async function getPendingListings() {
    return Listing.find({ status: "pending", isDeleted: false })
        .sort({ createdAt: 1 })
        .populate("owner", "name email phone");
}

export async function approveListing(listingId: string) {
    const listing = await findPendingListing(listingId);
    const now = new Date();

    if (listing.expiresAt) {
        // Re-approval after an edit: keep the original expiry
        if (listing.expiresAt <= now) {
            throw new AppError("This listing's expiry date has already passed", 400);
        }
    } else {
        // First approval: 60 days, but never beyond the owner's plan
        const subscription = await getCurrentSubscription(listing.owner);
        if (!subscription || subscription.expiresAt <= now) {
            throw new AppError("The owner's plan has expired", 400);
        }

        const sixtyDaysLater = new Date(
            now.getTime() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000
        );
        listing.expiresAt =
            sixtyDaysLater < subscription.expiresAt
                ? sixtyDaysLater
                : subscription.expiresAt;
    }

    listing.status = "approved";
    listing.approvedAt = now;
    listing.rejectionReason = undefined;
    await listing.save();
    await indexListing(listing);
    return listing;
}

export async function rejectListing(listingId: string, reason: string) {
    const listing = await findPendingListing(listingId);

    listing.status = "rejected";
    listing.rejectionReason = reason;
    await listing.save();
    await removeFromIndex(listing._id);
    return listing;
}

// ---------- All listings, remove and restore ----------

export type StatusFilter =
    | "all"
    | "live"
    | "pending"
    | "rejected"
    | "expired"
    | "removed";

const PAGE_SIZE = 20;
const ALL_STATUSES: StatusFilter[] = [
    "all",
    "live",
    "pending",
    "rejected",
    "expired",
    "removed",
];

// "live" and "expired" are not stored. We work them out from the dates.
function statusQuery(status: StatusFilter): Record<string, any> {
    const now = new Date();
    if (status === "live") return { status: "approved", expiresAt: { $gt: now } };
    if (status === "expired") return { status: "approved", expiresAt: { $lte: now } };
    if (status === "all") return {};
    return { status };
}

export async function getAllListings(status: StatusFilter, page: number) {
    const filter: Record<string, any> = { isDeleted: false, ...statusQuery(status) };

    const [items, total, countList] = await Promise.all([
        Listing.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .populate("owner", "name email phone"),
        Listing.countDocuments(filter),
        Promise.all(
            ALL_STATUSES.map((s) =>
                Listing.countDocuments({ isDeleted: false, ...statusQuery(s) })
            )
        ),
    ]);

    const counts = Object.fromEntries(ALL_STATUSES.map((s, i) => [s, countList[i]]));

    return {
        items,
        total,
        page,
        limit: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
        counts,
    };
}

async function findAnyListing(listingId: string) {
    if (!mongoose.isValidObjectId(listingId)) {
        throw new AppError("Listing not found", 404);
    }
    const listing = await Listing.findOne({ _id: listingId, isDeleted: false });
    if (!listing) {
        throw new AppError("Listing not found", 404);
    }
    return listing;
}

export async function removeListing(listingId: string, reason: string) {
    const listing = await findAnyListing(listingId);
    if (listing.status === "removed") {
        throw new AppError("This listing is already removed", 409);
    }

    listing.status = "removed";
    listing.removalReason = reason;
    await listing.save();
    await removeFromIndex(listing._id); // gone from AI search too

    return listing;
}

// Restoring sends it back to the review queue, it does not go live by itself
export async function restoreListing(listingId: string) {
    const listing = await findAnyListing(listingId);
    if (listing.status !== "removed") {
        throw new AppError("Only removed listings can be restored", 409);
    }

    listing.status = "pending";
    listing.removalReason = undefined;
    await listing.save();

    return listing;
}
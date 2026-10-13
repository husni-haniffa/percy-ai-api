import mongoose from "mongoose";
import { embeddings } from "../../config/openai.js";
import { AppError } from "../../lib/AppError.js";
import { activeFilter, publicFields } from "../browse/browse.service.js";
import { Listing } from "../listings/listing.model.js";
import { ListingVector } from "./ai-search.model.js";



const INDEX_NAME = "listing_vector_index";
const RESULT_COUNT = 6;
const MIN_MATCH_PERCENT = 55; // raise this later to hide weak matches

// The text that gets turned into numbers. Everything a buyer might search by goes in here.
export function buildListingText(listing: any) {
    const lines = [
        `${listing.category} for ${listing.purpose}.`,
        `Title: ${listing.title}.`,
        `Location: ${listing.city}, Sri Lanka.`,
        `Price: Rs. ${Number(listing.price).toLocaleString("en-US")}.`,
    ];

    if (listing.category === "property") {
        lines.push(`Property type: ${listing.propertyType}.`);
        if (listing.bedrooms !== undefined) lines.push(`${listing.bedrooms} bedrooms.`);
        if (listing.bathrooms !== undefined) lines.push(`${listing.bathrooms} bathrooms.`);
        if (listing.perches !== undefined) lines.push(`Land size: ${listing.perches} perches.`);
    } else {
        lines.push(
            `Vehicle: ${listing.year} ${listing.brand} ${listing.code}, ${listing.vehicleType}.`,
            `${Number(listing.mileage).toLocaleString("en-US")} km, ${listing.transmission}, ${listing.fuel}.`
        );
    }

    lines.push(`Description: ${listing.description}`);
    return lines.join("\n");
}

// Atlas cosine scores run from 0.5 to 1. Turn them back into a 0 to 100 similarity.
function toPercent(score: number) {
    return Math.round(Math.max(0, 2 * score - 1) * 100);
}

// ---- Keeping the index in sync. These never throw: a search-index problem must not break approving or editing. ----

export async function indexListing(listing: any) {
    try {
        const data = typeof listing.toObject === "function" ? listing.toObject() : listing;
        const text = buildListingText(data);
        const embedding = await embeddings.embedQuery(text);

        await ListingVector.updateOne(
            { listing: data._id },
            { $set: { text, embedding, expiresAt: data.expiresAt } },
            { upsert: true }
        );
    } catch (error) {
        console.error("AI index: could not index listing", error);
    }
}

export async function removeFromIndex(listingId: mongoose.Types.ObjectId) {
    try {
        await ListingVector.deleteOne({ listing: listingId });
    } catch (error) {
        console.error("AI index: could not remove listing", error);
    }
}

export async function removeExpiredVectors() {
    try {
        await ListingVector.deleteMany({ expiresAt: { $lte: new Date() } });
    } catch (error) {
        console.error("AI index: could not clean up expired listings", error);
    }
}

// Rebuilds the whole index from the listings that are live right now
export async function reindexAll() {
    const listings = await Listing.find(activeFilter()).lean();

    // Remove vectors of anything that is no longer live
    await ListingVector.deleteMany({ listing: { $nin: listings.map((l) => l._id) } });
    if (listings.length === 0) return { indexed: 0 };

    const texts = listings.map(buildListingText);
    const vectors = await embeddings.embedDocuments(texts); // one batch call

    await ListingVector.bulkWrite(
        listings.map((listing, i) => ({
            updateOne: {
                filter: { listing: listing._id },
                update: {
                    $set: {
                        text: texts[i],
                        embedding: vectors[i],
                        expiresAt: listing.expiresAt as Date, // always set: activeFilter() only returns approved, unexpired listings
                    },
                },
                upsert: true,
            },
        }))
    );

    return { indexed: listings.length };
}

// ---- Searching ----

export async function searchListings(query: string) {
    let queryVector: number[];
    try {
        queryVector = await embeddings.embedQuery(query);
    } catch (error) {
        console.error("AI search: could not embed the query", error);
        throw new AppError("AI search is unavailable right now. Please try again shortly.", 503);
    }

    // Ask Atlas for the closest listings. We ask for 12 to have spares in case some are stale.
    const hits = await ListingVector.aggregate<{
        listing: mongoose.Types.ObjectId;
        score: number;
    }>([
        {
            $vectorSearch: {
                index: INDEX_NAME,
                path: "embedding",
                queryVector,
                numCandidates: 100,
                limit: RESULT_COUNT * 2,
                filter: { expiresAt: { $gt: new Date() } },
            },
        },
        { $project: { _id: 0, listing: 1, score: { $meta: "vectorSearchScore" } } },
    ]);

    if (hits.length === 0) return [];

    // Load the real listings, and keep only the ones that are live right now
    const listings = await Listing.find({
        _id: { $in: hits.map((hit) => hit.listing) },
        ...activeFilter(),
    })
        .select(publicFields)
        .lean();

    const byId = new Map(listings.map((listing) => [String(listing._id), listing]));

    const results = [];
    for (const hit of hits) {
        const listing = byId.get(String(hit.listing));
        if (!listing) continue; // no longer live

        const matchScore = toPercent(hit.score);
        if (matchScore < MIN_MATCH_PERCENT) continue;

        results.push({ ...listing, matchScore });
        if (results.length === RESULT_COUNT) break;
    }

    return results;
}
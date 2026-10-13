import mongoose from "mongoose";

const listingVectorSchema = new mongoose.Schema(
    {
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
            unique: true,
        },
        text: { type: String, required: true },
        embedding: { type: [Number], required: true, select: false },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true, collection: "listing_vectors" }
);

export const ListingVector = mongoose.model("ListingVector", listingVectorSchema);
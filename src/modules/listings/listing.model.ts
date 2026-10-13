import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        purpose: { type: String, enum: ["sale", "rent"], required: true },
        price: { type: Number, required: true },
        city: { type: String, required: true },
        images: { type: [String], default: [] },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "removed"],
            default: "pending",
        },
        rejectionReason: { type: String },
        removalReason: { type: String },
        approvedAt: { type: Date },
        expiresAt: { type: Date },
        isDeleted: { type: Boolean, default: false },
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
        contactInfoViews: { type: Number, default: 0 },
    },
    { timestamps: true, discriminatorKey: "category" }
);

listingSchema.index({ status: 1, isDeleted: 1, expiresAt: 1, approvedAt: -1 });
export const Listing = mongoose.model("Listing", listingSchema);

export const PropertyListing = Listing.discriminator(
    "property",
    new mongoose.Schema({
        propertyType: {
            type: String,
            enum: ["house", "apartment", "land", "commercial"],
            required: true,
        },
        bedrooms: Number,
        bathrooms: Number,
        perches: Number,
    })
);

export const VehicleListing = Listing.discriminator(
    "vehicle",
    new mongoose.Schema({
        vehicleType: {
            type: String,
            enum: ["car", "van", "suv", "motorbike", "three-wheeler", "lorry"],
            required: true,
        },
        brand: { type: String, required: true },
        code: { type: String, required: true },
        year: { type: Number, required: true },
        mileage: { type: Number, required: true },
        transmission: { type: String, enum: ["manual", "automatic"], required: true },
        fuel: {
            type: String,
            enum: ["petrol", "diesel", "hybrid", "electric"],
            required: true,
        },
    })
);
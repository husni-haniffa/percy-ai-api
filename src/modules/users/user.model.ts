import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        clerkId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
        termsAcceptedAt: { type: Date },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
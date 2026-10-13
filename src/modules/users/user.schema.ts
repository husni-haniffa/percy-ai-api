import { type } from "arktype";

export const onboardSchema = type({
    phone: "string",
    acceptedTerms: "true",
});

// Returns the cleaned number like +94771234567, or null if invalid
export function normalizePhone(input: string) {
    const cleaned = input.replace(/[\s-]/g, "");

    if (/^07\d{8}$/.test(cleaned)) {
        return "+94" + cleaned.slice(1);
    }
    if (/^\+947\d{8}$/.test(cleaned)) {
        return cleaned;
    }
    return null;
}

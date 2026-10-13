import { z } from "zod";

export const rejectSchema = z.object({
    reason: z.string().min(5).max(500),
}).passthrough();

export const listQuerySchema = z.object({
    status: z.enum(["all", "live", "pending", "rejected", "expired", "removed"]).optional(),
    page: z.string().regex(/^-?\d+$/).optional(),
}).passthrough();
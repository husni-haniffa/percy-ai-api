import { z } from "zod";

export const searchSchema = z.object({
    query: z.string().min(3).max(300),
}).passthrough();
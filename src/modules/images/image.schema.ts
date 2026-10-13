import { z } from "zod";

export const presignSchema = z.object({
    contentTypes: z.array(z.string()).min(1).max(10),
}).passthrough();

export const rollbackSchema = z.object({
    keys: z.array(z.string()).min(1).max(10),
}).passthrough();
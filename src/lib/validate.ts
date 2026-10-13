import { z } from "zod";
import { AppError } from "./AppError.js";

export function validate<TSchema extends z.ZodType>(
    schema: TSchema,
    input: unknown,
    message?: string
): z.output<TSchema> {
    const result = schema.safeParse(input);
    if (!result.success) {
        const summary = result.error.issues.map((issue) => issue.message).join("; ");
        throw new AppError(message ?? summary, 400);
    }
    return result.data;
}

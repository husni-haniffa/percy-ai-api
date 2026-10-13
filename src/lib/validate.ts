import { type } from "arktype";
import type { BaseType } from "arktype";
import { AppError } from "./AppError.js";

export function validate<TSchema extends BaseType>(
    schema: TSchema,
    input: unknown,
    message?: string
): TSchema["infer"] {
    const result = schema(input);
    if (result instanceof type.errors) {
        throw new AppError(message ?? result.summary, 400);
    }
    return result;
}

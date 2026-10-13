import { type } from "arktype";

const keysSchema = type("string[]").narrow(
    (keys) => keys.length >= 1 && keys.length <= 10
);

export const presignSchema = type({
    contentTypes: type("string[]").narrow(
        (contentTypes) => contentTypes.length >= 1 && contentTypes.length <= 10
    ),
});

export const rollbackSchema = type({
    keys: keysSchema,
});

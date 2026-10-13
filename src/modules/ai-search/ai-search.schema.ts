import { type } from "arktype";

export const searchSchema = type({
    query: type("string>=3").narrow((query) => query.length <= 300),
});

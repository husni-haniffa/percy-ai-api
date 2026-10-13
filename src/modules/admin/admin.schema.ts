import { type } from "arktype";

export const rejectSchema = type({
    reason: type("string>=5").narrow((reason) => reason.length <= 500),
});

export const listQuerySchema = type({
    "status?": "'all' | 'live' | 'pending' | 'rejected' | 'expired' | 'removed'",
    "page?": type("string").narrow((value) => /^-?\d+$/.test(value)),
});

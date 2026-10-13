import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "./env.js";

export const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: env.openaiApiKey,
});
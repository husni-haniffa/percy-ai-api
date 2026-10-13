import { requireEnv } from "./env.js";

type Embeddings = import("@langchain/openai").OpenAIEmbeddings;

let embeddingsPromise: Promise<Embeddings> | undefined;

async function getEmbeddings() {
    if (!embeddingsPromise) {
        embeddingsPromise = import("@langchain/openai")
            .then(({ OpenAIEmbeddings }) => new OpenAIEmbeddings({
                model: "text-embedding-3-small",
                apiKey: requireEnv("OPENAI_API_KEY"),
            }))
            .catch((error: unknown) => {
                embeddingsPromise = undefined;
                throw error;
            });
    }
    return embeddingsPromise;
}

export async function embedQuery(query: string) {
    return (await getEmbeddings()).embedQuery(query);
}

export async function embedDocuments(documents: string[]) {
    return (await getEmbeddings()).embedDocuments(documents);
}
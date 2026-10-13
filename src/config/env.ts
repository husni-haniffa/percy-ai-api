import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: ".env.local" });
    dotenv.config();
}

export const env = {
    port: Number(process.env.PORT ?? 3000),
    mongoUri: process.env.MONGODB_URI,
    databaseName: process.env.DATABASE_NAME,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.R2_BUCKET,
    r2PublicUrl: process.env.R2_PUBLIC_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
};

export function requireEnv(name: string, value = process.env[name]): string {
    if (!value?.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
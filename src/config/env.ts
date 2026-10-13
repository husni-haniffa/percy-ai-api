import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: ".env.local" });
}

export const env = {
    port: Number(process.env.PORT),
    mongoUri: process.env.MONGODB_URI as string,
    databaseName: process.env.DATABASE_NAME as string,
    r2AccountId: process.env.R2_ACCOUNT_ID as string,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    r2Bucket: process.env.R2_BUCKET as string,
    r2PublicUrl: process.env.R2_PUBLIC_URL as string,
    openaiApiKey: process.env.OPENAI_API_KEY as string,
};
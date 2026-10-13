import { S3Client } from "@aws-sdk/client-s3";
import { env, requireEnv } from "./env.js";

let client: S3Client | undefined;

export function getR2Client() {
    if (!client) {
        const accountId = requireEnv("R2_ACCOUNT_ID", env.r2AccountId);
        client = new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: requireEnv("R2_ACCESS_KEY_ID", env.r2AccessKeyId),
                secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY", env.r2SecretAccessKey),
            },
        });
    }
    return client;
}
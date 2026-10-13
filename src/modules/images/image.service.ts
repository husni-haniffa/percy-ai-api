import { randomUUID } from "crypto";
import {
    PutObjectCommand,
    CopyObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { getR2Client } from "../../config/r2.js";
import { AppError } from "../../lib/AppError.js";



const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

function tempPrefix(userId: string) {
    return `listings/temp/${userId}/`;
}

function isUsersTempKey(userId: string, key: string) {
    return key.startsWith(tempPrefix(userId)) && !key.includes("..");
}

export function keyToUrl(key: string) {
    return `${env.r2PublicUrl}/${key}`;
}

// Step 2 of the flow: hand out upload tickets
export async function createUploadUrls(userId: string, contentTypes: string[]) {
    const tickets = [];

    for (const contentType of contentTypes) {
        const extension = extensions[contentType];
        if (!extension) {
            throw new AppError("Only JPG, PNG or WEBP images are allowed", 400);
        }

        const key = `${tempPrefix(userId)}${randomUUID()}.${extension}`;
        const command = new PutObjectCommand({
            Bucket: env.r2Bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });

        tickets.push({ key, uploadUrl });
    }

    return tickets;
}

// Deleting never throws: a failed cleanup should not break the user's request
export async function deleteKeys(keys: string[]) {
    if (keys.length === 0) return;

    try {
        await getR2Client().send(
            new DeleteObjectsCommand({
                Bucket: env.r2Bucket,
                Delete: { Objects: keys.map((Key) => ({ Key })) },
            })
        );
    } catch (error) {
        console.error("Failed to delete images:", error);
    }
}

// Step 5 of the flow: copy from the temp folder to the listing's folder
export async function promoteImages(
    userId: string,
    listingId: string,
    tempKeys: string[]
) {
    const newKeys: string[] = [];

    try {
        for (const tempKey of tempKeys) {
            if (!isUsersTempKey(userId, tempKey)) {
                throw new AppError("Invalid image", 400);
            }

            const fileName = tempKey.split("/").pop() as string;
            const newKey = `listings/${listingId}/${fileName}`;

            await getR2Client().send(
                new CopyObjectCommand({
                    Bucket: env.r2Bucket,
                    CopySource: `${env.r2Bucket}/${tempKey}`,
                    Key: newKey,
                })
            );
            newKeys.push(newKey);
        }
    } catch (error) {
        await deleteKeys(newKeys); // undo what we already copied
        if (error instanceof AppError) throw error;
        throw new AppError(
            "One of your images was not uploaded. Please upload it again.",
            400
        );
    }

    return newKeys;
}

// Rollback endpoint: only the user's own temp files can be deleted
export async function deleteTempImages(userId: string, keys: string[]) {
    const ownKeys = keys.filter((key) => isUsersTempKey(userId, key));
    await deleteKeys(ownKeys);
}

export function urlsToKeys(urls: string[]) {
    const prefix = `${env.r2PublicUrl}/`;
    return urls
        .filter((url) => url.startsWith(prefix))
        .map((url) => url.slice(prefix.length));
}
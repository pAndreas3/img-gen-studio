import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const bucket = process.env.R2_BUCKET;

if (!bucket) {
  throw new Error('R2_BUCKET environment variable is required');
}

// Validate other required environment variables
if (!process.env.R2_ENDPOINT) {
  throw new Error('R2_ENDPOINT environment variable is required');
}
if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('R2_ACCESS_KEY_ID environment variable is required');
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2_SECRET_ACCESS_KEY environment variable is required');
}

// Configurable expiration time (default 1 hour)
const URL_EXPIRATION = parseInt(process.env.R2_URL_EXPIRATION || '3600');

const validateKey = (key: string) => {
  if (!key || typeof key !== 'string') {
    throw new Error('Key must be a non-empty string');
  }
  // Prevent path traversal
  if (key.includes('..') || key.startsWith('/')) {
    throw new Error('Invalid key format');
  }
};

// R2 S3Client configuration
export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Generate presigned URL for uploading files to R2
export const getPresignedUploadUrl = async (key: string) => {
  validateKey(key);
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(r2, command, { expiresIn: URL_EXPIRATION });
};

// Generate presigned URL for downloading files from R2
export const getPresignedDownloadUrl = async (key: string) => {
  validateKey(key);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(r2, command, { expiresIn: URL_EXPIRATION });
};

// Check if file exists in R2
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    validateKey(key);
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    await r2.send(command);
    return true;
  } catch (error: any) {
    // If the error is 404 (NoSuchKey), the file doesn't exist
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // For other errors, re-throw them
    throw error;
  }
};

// Delete file from R2
export const deleteFile = async (key: string) => {
  validateKey(key);
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  return await r2.send(command);
};
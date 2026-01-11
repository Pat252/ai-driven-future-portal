/**
 * Cloudflare R2 Client
 * 
 * S3-compatible client for listing and accessing R2 objects.
 * Uses AWS SDK v3 with R2-specific configuration.
 */

import { S3Client, ListObjectsV2Command, PutObjectCommand, type ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

/**
 * Create S3Client configured for Cloudflare R2
 */
export function createR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'CRITICAL: R2 credentials missing.\n' +
      'Required environment variables:\n' +
      '  - R2_ACCOUNT_ID\n' +
      '  - R2_ACCESS_KEY_ID\n' +
      '  - R2_SECRET_ACCESS_KEY'
    );
  }
  
  // R2 endpoint format
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * List all objects in R2 bucket (handles pagination)
 */
export async function listAllR2Objects(bucketName: string): Promise<string[]> {
  const client = createR2Client();
  const allKeys: string[] = [];
  let continuationToken: string | undefined;
  
  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });
      
      const response: ListObjectsV2CommandOutput = await client.send(command);
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            allKeys.push(obj.Key);
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return allKeys;
  } catch (error) {
    throw new Error(
      `CRITICAL: Failed to list R2 objects from bucket "${bucketName}".\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}\n` +
      `Check your R2 credentials and bucket name.`
    );
  }
}

/**
 * Upload data to R2 bucket
 * 
 * @param bucketName - R2 bucket name
 * @param key - Object key (path) in bucket
 * @param data - Data to upload (will be JSON stringified)
 * @param contentType - Content type (default: application/json)
 */
export async function uploadToR2(
  bucketName: string,
  key: string,
  data: any,
  contentType: string = 'application/json'
): Promise<void> {
  const client = createR2Client();
  
  try {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    
    await client.send(command);
    console.log(`✅ Uploaded to R2: ${bucketName}/${key}`);
  } catch (error) {
    throw new Error(
      `CRITICAL: Failed to upload to R2 bucket "${bucketName}" at key "${key}".\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}\n` +
      `Check your R2 credentials and permissions.`
    );
  }
}


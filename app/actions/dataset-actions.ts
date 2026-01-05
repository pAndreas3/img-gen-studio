'use server';

import { getPresignedUploadUrl, getPresignedDownloadUrl, r2 } from "@/lib/storage";
import { nanoid } from "nanoid";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createDataset } from "@/lib/dataset/service";
import { CreateDatasetRequest } from "@/lib/dataset/create-dataset-request";
import { auth } from '@/lib/auth';


// Server action to generate presigned upload URL for ZIP dataset files
export async function generateZipUploadUrl(datasetId: string, zipFileName: string) {
  // Get current user session for security
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  const userId = session.user.id;

  if (!datasetId || !zipFileName) {
    throw new Error("Missing required fields: datasetId or zipFileName");
  }

  // Validate file name (basic security)
  if (zipFileName.includes('/') || zipFileName.includes('\\') || zipFileName.includes('..')) {
    throw new Error("Invalid file name format");
  }

  // Ensure ZIP extension
  if (!zipFileName.toLowerCase().endsWith('.zip')) {
    zipFileName = `${zipFileName}.zip`;
  }

  try {
    // For ZIP files, store directly in the dataset folder: userId/datasets/datasetId.zip
    // This makes it clear that the entire dataset is contained in this single ZIP file
    const key = `${userId}/datasets/${datasetId}.zip`;
    const url = await getPresignedUploadUrl(key);


    return { url, key };
  } catch (error) {
    console.error("Error generating presigned ZIP upload URL:", error);
    throw new Error("Failed to generate ZIP upload URL");
  }
}

// Server action to generate presigned download URL
export async function generateDownloadUrl(key: string) {
  if (!key) {
    throw new Error("Missing required field: key");
  }

  try {
    const url = await getPresignedDownloadUrl(key);
    return { url };
  } catch (error) {
    console.error("Error generating presigned download URL:", error);
    throw new Error("Failed to generate download URL");
  }
}

// Server action to create dataset after successful ZIP upload
export async function createDatasetFromZipUpload(
  zipKey: string, 
  imageCount: number,
  datasetName?: string
) {
  // Get current user session for security
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  const userId = session.user.id;

  if (!zipKey || !imageCount) {
    throw new Error("Missing required fields: zipKey or imageCount");
  }

  try {
    // For ZIP uploads, the key is: userId/datasets/datasetId.zip
    // Extract the dataset ID from the key
    const keyParts = zipKey.split('/');
    if (keyParts.length !== 3 || !keyParts[2].endsWith('.zip')) {
      throw new Error("Invalid ZIP key format");
    }
    
    const datasetId = keyParts[2].replace('.zip', '');
    
    // Build the R2 ZIP file URL
    const r2ZipUrl = `r2://${process.env.R2_BUCKET}/${zipKey}`;
    

    
    // Create dataset in database
    const datasetData: CreateDatasetRequest = {
      url: r2ZipUrl,
      number_of_images: imageCount,
      user_id: userId
    };

    const result = await createDataset(datasetData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create dataset');
    }


    
    return {
      success: true,
      dataset: result.data,
      zipKey,
      imageCount,
      zipUrl: r2ZipUrl
    };
    
  } catch (error) {
    console.error("Error creating dataset from ZIP upload:", error);
    throw new Error(`Failed to create dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Server action for R2 configuration testing
export async function testR2Configuration() {
  try {
    // Test 1: Check environment variables
    const envCheck = {
      R2_ENDPOINT: process.env.R2_ENDPOINT ? '✅ Set' : '❌ Missing',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      R2_BUCKET: process.env.R2_BUCKET ? '✅ Set' : '❌ Missing',
    };

    // Test 2: Try to list objects in bucket (basic connectivity test)
    let connectivityTest = 'Not tested';
    try {
      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET!,
        MaxKeys: 1
      });
      await r2.send(command);
      connectivityTest = '✅ Can connect to R2 bucket';
    } catch (error) {
      connectivityTest = `❌ Cannot connect to R2: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Test 3: Try to generate a presigned URL
    let presignedUrlTest = 'Not tested';
    try {
      const testKey = `test/test-${Date.now()}.txt`;
      const url = await getPresignedUploadUrl(testKey);
      presignedUrlTest = `✅ Can generate presigned URLs. Test URL generated for key: ${testKey}`;
    } catch (error) {
      presignedUrlTest = `❌ Cannot generate presigned URLs: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return {
      status: 'R2 Configuration Test',
      timestamp: new Date().toISOString(),
      tests: {
        environmentVariables: envCheck,
        connectivity: connectivityTest,
        presignedUrls: presignedUrlTest
      },
      recommendations: [
        'If environment variables are missing, check your .env.local file',
        'If connectivity fails, verify your R2 credentials and bucket name',
        'If presigned URLs fail, check your R2 API token permissions',
        'Make sure your R2 bucket has CORS configured for your domain'
      ]
    };
  } catch (error) {
    console.error("R2 configuration test failed:", error);
    throw new Error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


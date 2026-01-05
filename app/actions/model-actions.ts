'use server';

import { db } from '@/lib/db';
import { takeUniqueOrThrow } from '@/lib/helper';
import { createModel, getModelById, getModelByIdAndUserId, deleteModel, updateModel, updateModelStatus } from '@/lib/model/service';
import { getDatasetById } from '@/lib/dataset/service';
import { CreateModelRequest } from '@/lib/model/create-model-request';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { deleteFile, getPresignedDownloadUrl, fileExists } from '@/lib/storage';
import { startRunPodTraining, getRunPodTrainingStatus, cancelRunPodTraining } from '@/lib/runpod/service';
import { extractFileKeyFromUrl } from '@/lib/url-utils';

export async function startModelTraining(formData: {
    name: string;
    description?: string;
    type: string;
    resolution: string;
    training_steps: number;
    estimated_time_minutes: number;
    dataset_id: string; // Make dataset_id required
}) {
    // Get current user session
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('User not authenticated');
    }

    // Create model in database
    const modelData: CreateModelRequest = {
        name: formData.name,
        description: formData.description || '',
        type: formData.type,
        resolution: formData.resolution,
        training_steps: formData.training_steps,
        estimated_time_minutes: formData.estimated_time_minutes,
        status: 'pending',
        dataset_id: formData.dataset_id, // Use the provided dataset_id
        user_id: session.user.id
    };

    const result = await createModel(modelData);

    if (!result.success) {
        throw new Error(result.error || 'Failed to create model');
    }

    if (!result.data) {
        throw new Error('Model creation succeeded but no data returned');
    }

    // Get dataset information for RunPod API call
    const datasetResult = await getDatasetById(formData.dataset_id);
    if (!datasetResult.success || !datasetResult.data) {
        throw new Error('Failed to get dataset information for training');
    }

    const dataset = datasetResult.data;

    // Construct bucket paths for RunPod API
    const bucketName = process.env.R2_BUCKET || 'img-gen-studio-dev';
    // dataset.url already contains the full R2 path, so use it directly
    const datasetBucketPath = dataset.url;
    const modelBucketPath = `r2://${bucketName}/${session.user.id}/models/model-${result.data.id}.safetensors`;
    const logBucketPath = `r2://${bucketName}/${session.user.id}/models/training-${result.data.id}.log`;

    // Call RunPod training API
    const trainingResult = await startRunPodTraining({
        dataset_bucket_path: datasetBucketPath,
        model_bucket_path: modelBucketPath,
        steps: formData.training_steps,
        model_type: formData.type,
        log_bucket_path: logBucketPath,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/models/${result.data.id}/training-finished`
    });

    if (!trainingResult.success) {
        // If RunPod API fails, update model status to failed
        await updateModel(result.data.id, session.user.id, {
            status: 'failed'
        });
        throw new Error(`Failed to start training: ${trainingResult.error}`);
    }

    // Update model with training_run_id and change status to training
    const updateResult = await updateModel(result.data.id, session.user.id, {
        training_run_id: trainingResult.data!.id,
        status: 'training'
    });

    if (!updateResult.success) {
        console.error('Failed to update model with training_run_id:', updateResult.error);
        // Don't throw here as training has already started successfully
    }

    // Return success response with model ID for client-side redirect
    return { 
        success: true, 
        data: { 
            modelId: result.data.id,
            message: 'Training started successfully' 
        } 
    };
}

export async function getModelForPreview(id: string) {
    // Get current user session for security
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('User not authenticated');
    }

    const result = await getModelByIdAndUserId(id, session.user.id);

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch model');
    }

    return result.data;
}

export async function getModelAction(id: string) {
    try {
        // Get current user session for security
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Fetch model with user validation
        const result = await getModelByIdAndUserId(id, session.user.id);
        
        if (!result.success) {
            return { success: false, error: result.error || 'Failed to fetch model' };
        }

        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error fetching model:', error);
        return { success: false, error: 'Failed to fetch model' };
    }
}

export async function deleteModelAction(modelId: string) {
    try {
        // Get current user session for security
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'User not authenticated' };
        }

        // First, get the model to retrieve the file URL/key for R2 deletion
        const modelResult = await getModelByIdAndUserId(modelId, session.user.id);
        if (!modelResult.success || !modelResult.data) {
            return { success: false, error: 'Model not found or unauthorized' };
        }

        const model = modelResult.data;

        // Cancel training if the model is currently training
        if (model.status === 'training' && model.training_run_id) {
            try {
                const cancelResult = await cancelRunPodTraining(model.training_run_id);
                
                if (!cancelResult.success) {
                    console.error('Failed to cancel training on RunPod:', cancelResult.error);
                    // Continue with deletion even if cancellation fails
                }
            } catch (cancelError) {
                console.error('Error cancelling training:', cancelError);
                // Continue with deletion even if cancellation fails
            }
        }

        // Delete model artifact from R2 storage (if present)
        if (model.url) {
            try {
                let key: string;
                if (model.url.startsWith('r2://')) {
                    const parts = model.url.replace('r2://', '').split('/');
                    key = parts.slice(1).join('/');
                } else {
                    const u = new URL(model.url);
                    key = u.pathname.substring(1);
                }
                await deleteFile(key);
            } catch (storageError) {
                console.error('Failed to delete model file from R2 storage:', storageError);
                // Proceed with DB deletion even if storage deletion fails
            }
        }

        // Delete dataset file from R2 storage
        if (model.dataset_id) {
            try {
                // Get the dataset to retrieve the R2 file URL
                const datasetResult = await getDatasetById(model.dataset_id);
                if (datasetResult.success && datasetResult.data?.url) {
                    // Extract the key from the dataset URL
                    // Handle both r2:// and https:// URL formats
                    let key: string;
                    if (datasetResult.data.url.startsWith('r2://')) {
                        // Format: r2://bucket-name/path/to/file
                        // Extract everything after the bucket name
                        const urlParts = datasetResult.data.url.replace('r2://', '').split('/');
                        key = urlParts.slice(1).join('/'); // Skip bucket name, join the rest
                    } else {
                        // Standard HTTPS URL format
                        const url = new URL(datasetResult.data.url);
                        key = url.pathname.substring(1); // Remove leading slash
                    }
                    await deleteFile(key);
                }
            } catch (storageError) {
                console.error('Failed to delete dataset file from R2 storage:', storageError);
                // Continue with DB deletion even if storage deletion fails
                // You may want to handle this differently based on your requirements
            }
        }

        // Delete model from database
        const deleteResult = await deleteModel(modelId, session.user.id);

        if (!deleteResult.success) {
            return { success: false, error: deleteResult.error || 'Failed to delete model from database' };
        }

        return { success: true, data: deleteResult.data };
    } catch (error) {
        console.error('Error deleting model:', error);
        return { success: false, error: 'Failed to delete model' };
    }
}

export async function getTrainingStatusAction(
    trainingRequestId: string,
    modelId: string
) {
    try {
        
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'User not authenticated' };
        }

        if (!trainingRequestId) {
            return { success: false, error: 'Training request ID is required' };
        }

        // Verify user owns the model
        const modelResult = await getModelByIdAndUserId(modelId, session.user.id);
        if (!modelResult.success) {
            return { success: false, error: 'Model not found or unauthorized' };
        }

        // Call RunPod API to get training status
        const result = await getRunPodTrainingStatus(trainingRequestId);

        // If RunPod API fails, check if it's because the job was archived (404)
        if (!result.success) {
            
            if (result.error?.includes('404')) {
                try {
                    const modelResult = await getModelById(modelId);
                    if (modelResult.success && modelResult.data) {
                        const model = modelResult.data;

                        if (model.status === 'completed') {
                            return {
                                success: true,
                                data: {
                                    status: 'COMPLETED',
                                    currentStep: model.training_steps || 0,
                                    totalSteps: model.training_steps || 0,
                                    progressPercent: 100
                                }
                            };
                        }

                        if (model.status === 'failed') {
                            return {
                                success: true,
                                data: {
                                    status: 'FAILED',
                                    currentStep: 0,
                                    totalSteps: model.training_steps || 0,
                                    progressPercent: 0
                                }
                            };
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch model from database:', error);
                }
            }

            return {
                success: false,
                error: result.error || 'Failed to fetch training status'
            };
        }

        // Parse the response data to extract relevant information
        const responseData = result.data;

        if (!responseData) {
            return {
                success: false,
                error: 'No data received from RunPod API'
            };
        }

        // Extract status and progress information
        const status = responseData.status || 'UNKNOWN';
        const output = responseData.output || {};

        // Parse the training progress data
        const currentStep = output.step || 0;
        const totalSteps = output.total_steps || 0;
        const progressPercent = output.progress_percent || 0;
        const statusMessage = output.status || status;

        return {
            success: true,
            data: {
                status: statusMessage,
                currentStep,
                totalSteps,
                progressPercent
            }
        };

    } catch (error) {
        console.error('Error in getTrainingStatusAction:', error);
        return {
            success: false,
            error: 'Internal server error'
        };
    }
}

export async function cancelTrainingAction(modelId: string) {
    try {
        // Get current user session for security
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Verify user owns the model
        const modelResult = await getModelByIdAndUserId(modelId, session.user.id);
        if (!modelResult.success || !modelResult.data) {
            return { success: false, error: 'Model not found or unauthorized' };
        }

        const model = modelResult.data;

        // Check if model has a training run ID
        if (!model.training_run_id) {
            return { success: false, error: 'No active training to cancel' };
        }

        // Check if model is in a cancellable state
        if (model.status !== 'training') {
            return { success: false, error: 'Training is not in progress and cannot be cancelled' };
        }

        // Call RunPod API to cancel training
        const cancelResult = await cancelRunPodTraining(model.training_run_id);

        if (!cancelResult.success) {
            return { success: false, error: cancelResult.error || 'Failed to cancel training' };
        }

        // Update model status to cancelled
        const updateResult = await updateModel(modelId, session.user.id, {
            status: 'cancelled'
        });

        if (!updateResult.success) {
            console.error('Failed to update model status after cancellation:', updateResult.error);
            // Don't fail the entire operation if status update fails
        }

        return { success: true, data: { message: 'Training cancelled successfully' } };
    } catch (error) {
        console.error('Error in cancelTrainingAction:', error);
        return {
            success: false,
            error: 'Internal server error'
        };
    }
}

export async function getModelDownloadUrlAction(modelId: string) {
    try {
        // Get current user session for security
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Verify user owns the model
        const modelResult = await getModelByIdAndUserId(modelId, session.user.id);
        if (!modelResult.success || !modelResult.data) {
            return { success: false, error: 'Model not found or unauthorized' };
        }

        const model = modelResult.data;

        // Check if model has a URL
        if (!model.url) {
            return { success: false, error: 'Model is not ready for download yet' };
        }

        // Extract the key from the model URL
        const key = extractFileKeyFromUrl(model.url);

        // Check if the file exists in storage
        const fileExistsInStorage = await fileExists(key);
        if (!fileExistsInStorage) {
            return { success: false, error: 'Model file not found. The file may have been deleted or moved.' };
        }

        // Generate presigned download URL
        const signedUrl = await getPresignedDownloadUrl(key);

        return { 
            success: true, 
            data: { 
                downloadUrl: signedUrl,
                fileName: model.name.replace(/[^a-zA-Z0-9]/g, '_') + '.safetensors'
            } 
        };
    } catch (error) {
        console.error('Error generating model download URL:', error);
        return {
            success: false,
            error: 'Failed to generate download URL'
        };
    }
}
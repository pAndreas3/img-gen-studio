import 'server-only';

import { db } from '@/lib/db';
import { models } from './schema';
import { datasets } from '../dataset/schema';
import { eq, and, desc, getTableColumns } from 'drizzle-orm';
import { CreateModelRequest } from './create-model-request';
import { captureException } from '@sentry/nextjs';


export type UpdateModelRequest = Partial<Omit<CreateModelRequest, 'user_id'>>;

export async function createModel(data: CreateModelRequest) {
    try {
        const [newModel] = await db
            .insert(models)
            .values(data)
            .returning();
        return { success: true, data: newModel };
    } catch (error) {
        console.error('Error creating model:', error);
        captureException(error);
        return { success: false, error: 'Failed to create model' };
    }
}


export async function getModelById(id: string) {
    try {
        const [model] = await db
            .select()
            .from(models)
            .where(eq(models.id, id));

        if (!model) {
            return { success: false, error: 'Model not found' };
        }

        return { success: true, data: model };
    } catch (error) {
        console.error('Error fetching model:', error);
        captureException(error);
        return { success: false, error: 'Failed to fetch model' };
    }
}

export async function getModelByIdAndUserId(id: string, userId: string) {
    try {
        const [model] = await db
            .select({
                ...getTableColumns(models),
                numberOfImages: datasets.number_of_images
            })
            .from(models)
            .leftJoin(datasets, eq(models.dataset_id, datasets.id))
            .where(and(eq(models.id, id), eq(models.user_id, userId)));

        if (!model) {
            return { success: false, error: 'Model not found or unauthorized' };
        }

        return { success: true, data: model };
    } catch (error) {
        console.error('Error fetching model:', error);
        captureException(error);
        return { success: false, error: 'Failed to fetch model' };
    }
}

export async function getModelsByUserId(userId: string) {
    try {
        const userModels = await db
            .select({
                ...getTableColumns(models),
                numberOfImages: datasets.number_of_images
            })
            .from(models)
            .leftJoin(datasets, eq(models.dataset_id, datasets.id))
            .where(eq(models.user_id, userId))
            .orderBy(desc(models.created_at));

        return { success: true, data: userModels };
    } catch (error) {
        console.error('Error fetching user models:', error);
        captureException(error);
        return { success: false, error: 'Failed to fetch models' };
    }
}


export async function getAllModels(userId?: string) {
    try {
        const allModels = await db
            .select()
            .from(models)
            .where(userId ? eq(models.user_id, userId) : undefined)
            .orderBy(desc(models.created_at));

        return { success: true, data: allModels };
    } catch (error) {
        console.error('Error fetching all models:', error);
        captureException(error);
        return { success: false, error: 'Failed to fetch models' };
    }
}

// Update a model
export async function updateModel(id: string, userId: string, data: UpdateModelRequest) {
    try {
        const [updatedModel] = await db
            .update(models)
            .set(data)
            .where(and(eq(models.id, id), eq(models.user_id, userId)))
            .returning();

        if (!updatedModel) {
            return { success: false, error: 'Model not found or unauthorized' };
        }

        return { success: true, data: updatedModel };
    } catch (error) {
        console.error('Error updating model:', error);
        captureException(error);
        return { success: false, error: 'Failed to update model' };
    }
}


export async function deleteModel(id: string, userId: string) {
    try {
        const [deletedModel] = await db
            .delete(models)
            .where(and(eq(models.id, id), eq(models.user_id, userId)))
            .returning();

        if (!deletedModel) {
            return { success: false, error: 'Model not found or unauthorized' };
        }

        return { success: true, data: deletedModel };
    } catch (error) {
        console.error('Error deleting model:', error);
        captureException(error);
        return { success: false, error: 'Failed to delete model' };
    }
}

// Check if user owns a model
export async function isModelOwner(modelId: string, userId: string) {
    try {
        const [model] = await db
            .select({ id: models.id })
            .from(models)
            .where(and(eq(models.id, modelId), eq(models.user_id, userId)));

        return !!model;
    } catch (error) {
        console.error('Error checking model ownership:', error);
        captureException(error);
        return false;
    }
}

// Update model status
export async function updateModelStatus(modelId: string, status: string) {
    try {
        const [updatedModel] = await db
            .update(models)
            .set({ 
                status: status,
                completed_at: status === 'completed' ? new Date() : null
            })
            .where(eq(models.id, modelId))
            .returning();

        if (!updatedModel) {
            return { success: false, error: 'Model not found' };
        }

        return { success: true, data: updatedModel };
    } catch (error) {
        console.error('Error updating model status:', error);
        captureException(error);
        return { success: false, error: 'Failed to update model status' };
    }
}

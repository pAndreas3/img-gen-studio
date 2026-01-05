import 'server-only';

import { db } from '@/lib/db';
import { datasets } from './schema';
import { eq, and } from 'drizzle-orm';
import { CreateDatasetRequest } from './create-dataset-request';
import { captureException } from '@sentry/nextjs';


export type UpdateDatasetRequest = Partial<Omit<CreateDatasetRequest, 'user_id'>>;


export async function createDataset(data: CreateDatasetRequest) {
    try {
        const [newDataset] = await db
            .insert(datasets)
            .values(data)
            .returning();
        return { success: true, data: newDataset };
    } catch (error) {
        console.error('Error creating dataset:', error);
        captureException(error);
        return { success: false, error: 'Failed to create dataset' };
    }
}


export async function getDatasetById(id: string) {
    try {
        const [dataset] = await db
            .select()
            .from(datasets)
            .where(eq(datasets.id, id));

        if (!dataset) {
            return { success: false, error: 'Dataset not found' };
        }

        return { success: true, data: dataset };
    } catch (error) {
        console.error('Error fetching dataset:', error);
        captureException(error);
        return { success: false, error: 'Failed to fetch dataset' };
    }
}


export async function getDatasetsByUserId(userId: string) {
    try {
        const userDatasets = await db
            .select()
            .from(datasets)
            .where(eq(datasets.user_id, userId));

        return { success: true, data: userDatasets };
    } catch (error) {
        console.error('Error fetching user datasets:', error);
        captureException(error);
        return { success: false, error: 'Failed to fetch datasets' };
    }
}



export async function updateDataset(id: string, userId: string, data: UpdateDatasetRequest) {
    try {
        const [updatedDataset] = await db
            .update(datasets)
            .set(data)
            .where(and(eq(datasets.id, id), eq(datasets.user_id, userId)))
            .returning();

        if (!updatedDataset) {
            return { success: false, error: 'Dataset not found or unauthorized' };
        }

        return { success: true, data: updatedDataset };
    } catch (error) {
        console.error('Error updating dataset:', error);
        captureException(error);
        return { success: false, error: 'Failed to update dataset' };
    }
}


export async function deleteDataset(id: string, userId: string) {
    try {
        const [deletedDataset] = await db
            .delete(datasets)
            .where(and(eq(datasets.id, id), eq(datasets.user_id, userId)))
            .returning();

        if (!deletedDataset) {
            return { success: false, error: 'Dataset not found or unauthorized' };
        }

        return { success: true, data: deletedDataset };
    } catch (error) {
        console.error('Error deleting dataset:', error);
        captureException(error);
        return { success: false, error: 'Failed to delete dataset' };
    }
}


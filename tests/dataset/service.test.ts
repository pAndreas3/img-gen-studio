import { beforeAll, afterAll, afterEach, describe, it, expect } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase, getTestDb } from '../setup/test-db';

import { users, accounts, sessions, verificationTokens } from '@/lib/user/schema';
import { datasets } from '@/lib/dataset/schema';
import { models } from '@/lib/model/schema';
import { v4 as uuidv4 } from 'uuid';

import {
    createDataset,
    getDatasetById,
    getDatasetsByUserId,
    updateDataset,
    deleteDataset
} from '@/lib/dataset/service';
import { CreateDatasetRequest } from '@/lib/dataset/create-dataset-request';

// Mock the db import - make it dynamic so it returns the current test db
jest.mock('@/lib/db', () => ({
    get db() {
        return require('../setup/test-db').getTestDb();
    }
}));

describe('Dataset Service', () => {
    let testDb: ReturnType<typeof getTestDb>;

    beforeAll(async () => {
        testDb = await setupTestDatabase();
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    afterEach(async () => {
        // Clean up all tables in correct order (respecting foreign key constraints)
        await testDb.delete(models);
        await testDb.delete(datasets);
        await testDb.delete(accounts);
        await testDb.delete(sessions);
        await testDb.delete(verificationTokens);
        await testDb.delete(users);
    });

    const testHelpers = {
        async createTestUser() {
            const [createdUser] = await testDb.insert(users).values({
                name: 'Test User',
                email: 'test@example.com',
                passwordHash: 'hashedpassword123'
            }).returning();
            return createdUser;
        }
    };

    describe('createDataset', () => {
        it('should create a new dataset successfully', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const createDatasetRequest: CreateDatasetRequest = {
                url: 'https://example.com/dataset',
                number_of_images: 100,
                user_id: testUser.id
            };

            // Act
            const result = await createDataset(createDatasetRequest);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.url).toBe('https://example.com/dataset');
            expect(result.data!.number_of_images).toBe(100);
            expect(result.data!.user_id).toBe(testUser.id);
            expect(result.data!.id).toBeDefined();
        });

        it('should handle database errors gracefully', async () => {
            // Suppress console.error for this test since we expect an error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Arrange
            const invalidRequest: CreateDatasetRequest = {
                url: 'https://example.com/dataset',
                number_of_images: 100,
                user_id: uuidv4()
            };

            // Act
            const result = await createDataset(invalidRequest);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to create dataset');

            // Restore console.error
            consoleSpy.mockRestore();
        });
    });

    describe('getDatasetById', () => {
        it('should return a dataset when found', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const createDatasetRequest: CreateDatasetRequest = {
                url: 'https://example.com/test-dataset',
                number_of_images: 50,
                user_id: testUser.id
            };
            const createResult = await createDataset(createDatasetRequest);
            const datasetId = createResult.data!.id;

            // Act
            const result = await getDatasetById(datasetId);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.id).toBe(datasetId);
            expect(result.data!.url).toBe('https://example.com/test-dataset');
            expect(result.data!.number_of_images).toBe(50);
            expect(result.data!.user_id).toBe(testUser.id);
        });

        it('should return error when dataset not found', async () => {
            // Arrange
            const nonExistentId = uuidv4();

            // Act
            const result = await getDatasetById(nonExistentId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Dataset not found');
        });
    });

    describe('getDatasetsByUserId', () => {
        it('should return all datasets for a user', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();

            // Create multiple datasets
            await createDataset({
                url: 'https://example.com/dataset1',
                number_of_images: 100,
                user_id: testUser.id
            });
            await createDataset({
                url: 'https://example.com/dataset2',
                number_of_images: 200,
                user_id: testUser.id
            });

            // Act
            const result = await getDatasetsByUserId(testUser.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(2);
            expect(result.data!.some(d => d.url === 'https://example.com/dataset1')).toBe(true);
            expect(result.data!.some(d => d.url === 'https://example.com/dataset2')).toBe(true);
        });

        it('should return empty array when user has no datasets', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();

            // Act
            const result = await getDatasetsByUserId(testUser.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(0);
        });

        it('should return empty array for non-existent user', async () => {
            // Arrange
            const nonExistentUserId = uuidv4();

            // Act
            const result = await getDatasetsByUserId(nonExistentUserId);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(0);
        });

        it('should only return datasets for the specified user', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            await createDataset({
                url: 'https://example.com/user1-dataset',
                number_of_images: 100,
                user_id: testUser1.id
            });
            await createDataset({
                url: 'https://example.com/user2-dataset',
                number_of_images: 200,
                user_id: testUser2.id
            });

            // Act
            const result = await getDatasetsByUserId(testUser1.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(1);
            expect(result.data![0].url).toBe('https://example.com/user1-dataset');
        });
    });

    describe('updateDataset', () => {
        it('should update a dataset successfully', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const createResult = await createDataset({
                url: 'https://example.com/original-dataset',
                number_of_images: 100,
                user_id: testUser.id
            });
            const datasetId = createResult.data!.id;

            const updateData = {
                url: 'https://example.com/updated-dataset',
                number_of_images: 150
            };

            // Act
            const result = await updateDataset(datasetId, testUser.id, updateData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.url).toBe('https://example.com/updated-dataset');
            expect(result.data!.number_of_images).toBe(150);
        });

        it('should return error when dataset not found', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const nonExistentId = uuidv4();
            const updateData = { url: 'https://example.com/updated-dataset' };

            // Act
            const result = await updateDataset(nonExistentId, testUser.id, updateData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Dataset not found or unauthorized');
        });

        it('should return error when user is not authorized', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            const createResult = await createDataset({
                url: 'https://example.com/user1-dataset',
                number_of_images: 100,
                user_id: testUser1.id
            });
            const datasetId = createResult.data!.id;

            const updateData = { url: 'https://example.com/unauthorized-update' };

            // Act
            const result = await updateDataset(datasetId, testUser2.id, updateData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Dataset not found or unauthorized');
        });

        it('should update partial fields only', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const createResult = await createDataset({
                url: 'https://example.com/original-dataset',
                number_of_images: 100,
                user_id: testUser.id
            });
            const datasetId = createResult.data!.id;

            const updateData = { number_of_images: 200 };

            // Act
            const result = await updateDataset(datasetId, testUser.id, updateData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.url).toBe('https://example.com/original-dataset'); // Should remain unchanged
            expect(result.data!.number_of_images).toBe(200); // Should be updated
        });
    });

    describe('deleteDataset', () => {
        it('should delete a dataset successfully', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const createResult = await createDataset({
                url: 'https://example.com/dataset-to-delete',
                number_of_images: 100,
                user_id: testUser.id
            });
            const datasetId = createResult.data!.id;

            // Act
            const result = await deleteDataset(datasetId, testUser.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.id).toBe(datasetId);

            // Verify dataset is actually deleted
            const getResult = await getDatasetById(datasetId);
            expect(getResult.success).toBe(false);
        });

        it('should return error when dataset not found', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const nonExistentId = uuidv4();

            // Act
            const result = await deleteDataset(nonExistentId, testUser.id);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Dataset not found or unauthorized');
        });

        it('should return error when user is not authorized', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            const createResult = await createDataset({
                url: 'https://example.com/user1-dataset',
                number_of_images: 100,
                user_id: testUser1.id
            });
            const datasetId = createResult.data!.id;

            // Act
            const result = await deleteDataset(datasetId, testUser2.id);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Dataset not found or unauthorized');
        });
    });
}); 
import { beforeAll, afterAll, afterEach, describe, it, expect } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase, getTestDb } from '../setup/test-db';
import { v4 as uuidv4 } from 'uuid';

import { users, accounts, sessions, verificationTokens } from '@/lib/user/schema';
import { datasets } from '@/lib/dataset/schema';
import { models } from '@/lib/model/schema';

import {
    createModel,
    getModelById,
    getModelsByUserId,
    getAllModels,
    updateModel,
    deleteModel,
    isModelOwner
} from '@/lib/model/service';
import { CreateModelRequest } from '@/lib/model/create-model-request';

// Mock the db import - make it dynamic so it returns the current test db
jest.mock('@/lib/db', () => ({
    get db() {
        return require('../setup/test-db').getTestDb();
    }
}));

describe('Model Service', () => {
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
        },

        async createTestDataset(userId: string) {
            const [createdDataset] = await testDb.insert(datasets).values({
                url: 'https://example.com/dataset',
                number_of_images: 100,
                user_id: userId
            }).returning();
            return createdDataset;
        }
    };

    describe('createModel', () => {
        it('should create a new model successfully', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const testDataset = await testHelpers.createTestDataset(testUser.id);
            const createModelRequest: CreateModelRequest = {
                name: 'New Model',
                description: 'A new test model',
                type: 'object-detection',
                dataset_id: testDataset.id,
                user_id: testUser.id
            };

            // Act
            const createModelResult = await createModel(createModelRequest);

            // Assert
            expect(createModelResult.success).toBe(true);
            expect(createModelResult.data).toBeDefined();
            expect(createModelResult.data!.name).toBe('New Model');
            expect(createModelResult.data!.description).toBe('A new test model');
            expect(createModelResult.data!.type).toBe('object-detection');
            expect(createModelResult.data!.dataset_id).toBe(testDataset.id);
            expect(createModelResult.data!.user_id).toBe(testUser.id);
            expect(createModelResult.data!.id).toBeDefined();
            expect(createModelResult.data!.created_at).toBeDefined();
        });

        it('should handle database errors gracefully', async () => {
            // Suppress console.error for this test since we expect an error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Arrange
            const invalidRequest: CreateModelRequest = {
                name: 'Invalid Model',
                description: 'A model with invalid dataset_id',
                type: 'object-detection',
                dataset_id: uuidv4(), // This should cause a foreign key error
                user_id: uuidv4() // This should cause a foreign key error
            };

            // Act
            const result = await createModel(invalidRequest);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to create model');

            // Restore console.error
            consoleSpy.mockRestore();
        });

    });

    describe('getModelById', () => {
        it('should return a model when found', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const testDataset = await testHelpers.createTestDataset(testUser.id);
            const createModelRequest: CreateModelRequest = {
                name: 'Test Model',
                description: 'A test model',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser.id
            };
            const createResult = await createModel(createModelRequest);
            const modelId = createResult.data!.id;

            // Act
            const result = await getModelById(modelId);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.id).toBe(modelId);
            expect(result.data!.name).toBe('Test Model');
            expect(result.data!.description).toBe('A test model');
            expect(result.data!.type).toBe('classification');
        });

        it('should return error when model not found', async () => {
            // Arrange
            const nonExistentId = uuidv4();

            // Act
            const result = await getModelById(nonExistentId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Model not found');
        });
    });

    describe('getModelsByUserId', () => {
        it('should return all models for a user', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const testDataset = await testHelpers.createTestDataset(testUser.id);

            // Create multiple models with delay to ensure different timestamps
            await createModel({
                name: 'Model 1',
                description: 'First model',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser.id
            });

            // Add small delay to ensure different created_at timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            await createModel({
                name: 'Model 2',
                description: 'Second model',
                type: 'object-detection',
                dataset_id: testDataset.id,
                user_id: testUser.id
            });

            // Act
            const result = await getModelsByUserId(testUser.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(2);
            expect(result.data![0].name).toBe('Model 2'); // Should be ordered by created_at desc
            expect(result.data![1].name).toBe('Model 1');
        });

        it('should return empty array when user has no models', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();

            // Act
            const result = await getModelsByUserId(testUser.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(0);
        });

        it('should return empty array for non-existent user', async () => {
            // Arrange
            const nonExistentUserId = uuidv4();

            // Act
            const result = await getModelsByUserId(nonExistentUserId);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(0);
        });
    });

    describe('getAllModels', () => {
        it('should return all models when no userId filter provided', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            const testDataset1 = await testHelpers.createTestDataset(testUser1.id);
            const testDataset2 = await testDb.insert(datasets).values({
                url: 'https://example.com/dataset2',
                number_of_images: 200,
                user_id: testUser2.id
            }).returning().then(result => result[0]);

            await createModel({
                name: 'Model 1',
                description: 'User 1 model',
                type: 'classification',
                dataset_id: testDataset1.id,
                user_id: testUser1.id
            });
            await createModel({
                name: 'Model 2',
                description: 'User 2 model',
                type: 'object-detection',
                dataset_id: testDataset2.id,
                user_id: testUser2.id
            });

            // Act
            const result = await getAllModels();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(2);
        });

        it('should return filtered models when userId provided', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            const testDataset1 = await testHelpers.createTestDataset(testUser1.id);
            const testDataset2 = await testDb.insert(datasets).values({
                url: 'https://example.com/dataset2',
                number_of_images: 200,
                user_id: testUser2.id
            }).returning().then(result => result[0]);

            await createModel({
                name: 'Model 1',
                description: 'User 1 model',
                type: 'classification',
                dataset_id: testDataset1.id,
                user_id: testUser1.id
            });
            await createModel({
                name: 'Model 2',
                description: 'User 2 model',
                type: 'object-detection',
                dataset_id: testDataset2.id,
                user_id: testUser2.id
            });

            // Act
            const result = await getAllModels(testUser1.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(1);
            expect(result.data![0].name).toBe('Model 1');
        });

        it('should return empty array when no models exist', async () => {
            // Act
            const result = await getAllModels();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(0);
        });
    });

    describe('updateModel', () => {
        it('should update a model successfully', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const testDataset = await testHelpers.createTestDataset(testUser.id);
            const createResult = await createModel({
                name: 'Original Model',
                description: 'Original description',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser.id
            });
            const modelId = createResult.data!.id;

            const updateData = {
                name: 'Updated Model',
                description: 'Updated description',
                type: 'object-detection'
            };

            // Act
            const result = await updateModel(modelId, testUser.id, updateData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.name).toBe('Updated Model');
            expect(result.data!.description).toBe('Updated description');
            expect(result.data!.type).toBe('object-detection');
        });

        it('should return error when model not found', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const nonExistentId = uuidv4();
            const updateData = { name: 'Updated Model' };

            // Act
            const result = await updateModel(nonExistentId, testUser.id, updateData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Model not found or unauthorized');
        });

        it('should return error when user is not authorized', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            const testDataset = await testHelpers.createTestDataset(testUser1.id);
            const createResult = await createModel({
                name: 'User 1 Model',
                description: 'User 1 description',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser1.id
            });
            const modelId = createResult.data!.id;

            const updateData = { name: 'Unauthorized Update' };

            // Act
            const result = await updateModel(modelId, testUser2.id, updateData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Model not found or unauthorized');
        });

        it('should update partial fields only', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const testDataset = await testHelpers.createTestDataset(testUser.id);
            const createResult = await createModel({
                name: 'Original Model',
                description: 'Original description',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser.id
            });
            const modelId = createResult.data!.id;

            const updateData = { name: 'Updated Name Only' };

            // Act
            const result = await updateModel(modelId, testUser.id, updateData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.name).toBe('Updated Name Only');
            expect(result.data!.description).toBe('Original description'); // Should remain unchanged
            expect(result.data!.type).toBe('classification'); // Should remain unchanged
        });
    });

    describe('deleteModel', () => {
        it('should delete a model successfully', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const testDataset = await testHelpers.createTestDataset(testUser.id);
            const createResult = await createModel({
                name: 'Model to Delete',
                description: 'This will be deleted',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser.id
            });
            const modelId = createResult.data!.id;

            // Act
            const result = await deleteModel(modelId, testUser.id);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.id).toBe(modelId);

            // Verify model is actually deleted
            const getResult = await getModelById(modelId);
            expect(getResult.success).toBe(false);
        });

        it('should return error when model not found', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const nonExistentId = uuidv4();

            // Act
            const result = await deleteModel(nonExistentId, testUser.id);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Model not found or unauthorized');
        });

        it('should return error when user is not authorized', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            const testDataset = await testHelpers.createTestDataset(testUser1.id);
            const createResult = await createModel({
                name: 'User 1 Model',
                description: 'User 1 description',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser1.id
            });
            const modelId = createResult.data!.id;

            // Act
            const result = await deleteModel(modelId, testUser2.id);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Model not found or unauthorized');
        });
    });

    describe('isModelOwner', () => {
        it('should return true when user owns the model', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const testDataset = await testHelpers.createTestDataset(testUser.id);
            const createResult = await createModel({
                name: 'User Model',
                description: 'User owned model',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser.id
            });
            const modelId = createResult.data!.id;

            // Act
            const result = await isModelOwner(modelId, testUser.id);

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when user does not own the model', async () => {
            // Arrange
            const testUser1 = await testHelpers.createTestUser();
            const testUser2 = await testDb.insert(users).values({
                name: 'Test User 2',
                email: 'test2@example.com',
                passwordHash: 'hashedpassword123'
            }).returning().then(result => result[0]);

            const testDataset = await testHelpers.createTestDataset(testUser1.id);
            const createResult = await createModel({
                name: 'User 1 Model',
                description: 'User 1 owned model',
                type: 'classification',
                dataset_id: testDataset.id,
                user_id: testUser1.id
            });
            const modelId = createResult.data!.id;

            // Act
            const result = await isModelOwner(modelId, testUser2.id);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when model does not exist', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const nonExistentId = uuidv4();

            // Act
            const result = await isModelOwner(nonExistentId, testUser.id);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when database error occurs', async () => {
            // Arrange
            const testUser = await testHelpers.createTestUser();
            const invalidModelId = null as any; // This should cause an error

            // Act
            const result = await isModelOwner(invalidModelId, testUser.id);

            // Assert
            expect(result).toBe(false);
        });
    });
}); 
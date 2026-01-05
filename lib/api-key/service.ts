import 'server-only';

import { db } from '../db';
import { apiKeys, type NewApiKey } from './schema';
import { eq, and, isNull, or, lt } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

/**
 * Generate a new API key with proper format and security
 * Format: ak_[32 random chars]
 */
export function generateApiKey(): { key: string; hash: string; preview: string } {
    const prefix = 'ak_';
    const randomPart = randomBytes(16).toString('hex'); // 32 characters
    const key = `${prefix}${randomPart}`;
    
    // Hash the key for storage (never store the plain key)
    const hash = createHash('sha256').update(key).digest('hex');
    
    // Keep last 4 characters for display
    const preview = `...${key.slice(-4)}`;
    
    return { key, hash, preview };
}

/**
 * Hash an API key for comparison
 */
export function hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
    userId: string,
    options: {
        name?: string;
        expiresAt?: Date;
    } = {}
): Promise<{ apiKey: typeof apiKeys.$inferSelect; plainKey: string }> {
    const { key, hash, preview } = generateApiKey();
    
    const newApiKey: NewApiKey = {
        userId,
        keyHash: hash,
        keyPreview: preview,
        name: options.name,
        expiresAt: options.expiresAt,
    };
    
    const [createdKey] = await db.insert(apiKeys).values(newApiKey).returning();
    
    return {
        apiKey: createdKey,
        plainKey: key, // Return this only once, never store it
    };
}

/**
 * Verify an API key and return user info if valid
 */
export async function verifyApiKey(key: string): Promise<{
    isValid: boolean;
    userId?: string;
    apiKeyId?: string;
    reason?: string;
}> {
    const hash = hashApiKey(key);
    
    const [apiKey] = await db
        .select()
        .from(apiKeys)
        .where(
            and(
                eq(apiKeys.keyHash, hash),
                eq(apiKeys.isActive, true),
                or(
                    isNull(apiKeys.expiresAt),
                    lt(apiKeys.expiresAt, new Date())
                )
            )
        )
        .limit(1);
    
    if (!apiKey) {
        return { isValid: false, reason: 'Invalid or expired API key' };
    }
    
    return {
        isValid: true,
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
    };
}

/**
 * Get all API keys for a user (safe data only)
 */
export async function getUserApiKeys(userId: string) {
    return await db
        .select({
            id: apiKeys.id,
            name: apiKeys.name,
            keyPreview: apiKeys.keyPreview,
            isActive: apiKeys.isActive,
            createdAt: apiKeys.createdAt,
            expiresAt: apiKeys.expiresAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId))
        .orderBy(apiKeys.createdAt);
}

/**
 * Revoke (deactivate) an API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
        .returning();
    
    return result.length > 0;
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await db
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
        .returning();
    
    return result.length > 0;
}



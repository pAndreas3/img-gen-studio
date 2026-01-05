'use server';

import { auth } from '@/lib/auth';
import { createApiKey, getUserApiKeys, revokeApiKey } from '@/lib/api-key/service';
import { redirect } from 'next/navigation';

export interface CreateApiKeyResult {
  success: boolean;
  apiKey?: {
    id: string;
    name: string | null;
    keyPreview: string;
    plainKey: string; // Only returned once
  };
  error?: string;
}

export interface ApiKeyListItem {
  id: string;
  name: string | null;
  keyPreview: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Server action to create a new API key
 */
export async function createApiKeyAction(formData: {
  name: string;
  description?: string;
}): Promise<CreateApiKeyResult> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      redirect('/login');
    }

    const result = await createApiKey(session.user.id, {
      name: formData.name || undefined,
    });

    return {
      success: true,
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        keyPreview: result.apiKey.keyPreview,
        plainKey: result.plainKey,
      },
    };
  } catch (error) {
    console.error('Failed to create API key:', error);
    return {
      success: false,
      error: 'Failed to create API key. Please try again.',
    };
  }
}

/**
 * Server action to get user's API keys
 */
export async function getUserApiKeysAction(): Promise<ApiKeyListItem[]> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      redirect('/login');
    }

    const apiKeys = await getUserApiKeys(session.user.id);
    
    return apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPreview: key.keyPreview,
      isActive: key.isActive,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
    }));
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return [];
  }
}

/**
 * Server action to revoke an API key
 */
export async function revokeApiKeyAction(keyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      redirect('/login');
    }

    const success = await revokeApiKey(keyId, session.user.id);
    
    if (!success) {
      return {
        success: false,
        error: 'API key not found or already revoked.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return {
      success: false,
      error: 'Failed to revoke API key. Please try again.',
    };
  }
}

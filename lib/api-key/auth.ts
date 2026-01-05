import 'server-only';

import { NextRequest } from 'next/server';
import { verifyApiKey } from './service';

export interface AuthResult {
  success: boolean;
  userId?: string;
  apiKeyId?: string;
  error?: string;
}

/**
 * Authenticate a request using API key from X-API-Key header
 * Expected format: "X-API-Key: ak_xxxxx"
 * 
 * Example usage:
 * ```
 * fetch('/api/v1/models/model-id/generate', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-API-Key': 'ak_1234567890abcdef'
 *   },
 *   body: JSON.stringify({ prompt: 'A beautiful sunset' })
 * })
 * ```
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthResult> {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Missing X-API-Key header'
    };
  }
  
  // Validate API key format
  if (!apiKey.startsWith('ak_')) {
    return {
      success: false,
      error: 'Invalid API key format'
    };
  }
  
  // Verify the API key
  const verification = await verifyApiKey(apiKey);
  
  if (!verification.isValid) {
    return {
      success: false,
      error: verification.reason || 'Invalid API key'
    };
  }
  
  return {
    success: true,
    userId: verification.userId!,
    apiKeyId: verification.apiKeyId!
  };
}

/**
 * Helper function to create authentication error responses
 */
export function createAuthErrorResponse(message: string, status: number = 401) {
  return Response.json(
    { 
      error: message,
      code: 'AUTHENTICATION_FAILED'
    },
    { status }
  );
}

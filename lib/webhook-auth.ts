import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates webhook authentication token from Authorization header only
 * @param request - The incoming Next.js request
 * @returns Object with success status and error message if failed
 */
export function validateWebhookToken(request: NextRequest): {
  success: boolean;
  error?: string;
} {
  // Get the expected token from environment variables
  const expectedToken = process.env.CUSTOM_WEBHOOK_TOKEN;
  
  if (!expectedToken) {
    console.error('CUSTOM_WEBHOOK_TOKEN environment variable is not set');
    return {
      success: false,
      error: 'Webhook authentication not configured'
    };
  }

  // Get the token from Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    console.error('No Authorization header provided in webhook request');
    return {
      success: false,
      error: 'Authorization header required'
    };
  }

  // Validate the token
  if (authHeader !== expectedToken) {
    console.error('Invalid webhook authentication token provided');
    return {
      success: false,
      error: 'Invalid authentication token'
    };
  }

  return { success: true };
}

/**
 * Middleware function to validate webhook authentication
 * Returns a NextResponse with error if authentication fails
 * @param request - The incoming Next.js request
 * @returns NextResponse with error if auth fails, null if successful
 */
export function validateWebhookAuth(request: NextRequest): NextResponse | null {
  const authResult = validateWebhookToken(request);
  
  if (!authResult.success) {
    return NextResponse.json(
      { 
        error: 'Unauthorized',
        message: authResult.error 
      },
      { status: 401 }
    );
  }
  
  return null; // Authentication successful
}

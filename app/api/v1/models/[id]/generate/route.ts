import { NextRequest } from 'next/server';
import { GenerateImageRequest, GenerateImageResponse, DEFAULT_GENERATION_PARAMS, GENERATION_CONSTRAINTS } from '@/lib/types/api';
import { authenticateApiRequest, createAuthErrorResponse } from '@/lib/api-key/auth';
import { getModelByIdAndUserId } from '@/lib/model/service';

function createErrorResponse(message: string, status: number = 400) {
  return Response.json(
    { error: message },
    { status }
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await context.params;

    // Authenticate the API request
    const authResult = await authenticateApiRequest(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!);
    }

    // Parse and validate the request body
    let body: GenerateImageRequest;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse('Request body must be valid JSON', 400);
    }
    
    const validationResult = validateGenerationRequest(body);
    if (!validationResult.success) {
      return createErrorResponse(validationResult.error!, 400);
    }

    const params = {
      ...DEFAULT_GENERATION_PARAMS,
      ...body,
    };

    // Generate seed if not provided
    if (params.seed === undefined) {
      params.seed = Math.floor(Math.random() * 1000000);
    }

    // Real RunPod inference call
    const startTime = Date.now();
    const generatedImages = await generateImagesWithRunPod(params, modelId, authResult.userId!);
    const inferenceTime = (Date.now() - startTime) / 1000;

    // Return the response
    const response: GenerateImageResponse = {
      images: generatedImages,
      inference_time: inferenceTime,
      parameters: {
        prompt: params.prompt,
        negative_prompt: params.negative_prompt || '',
        count: params.count,
        num_inference_steps: params.num_inference_steps,
        guidance_scale: params.guidance_scale,
        height: params.height,
        width: params.width,
        seed: params.seed,
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error('Error in generate endpoint:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

function validateGenerationRequest(body: any): { success: boolean; error?: string } {
  if (!body.prompt || typeof body.prompt !== 'string') {
    return { success: false, error: 'Prompt is required and must be a string' };
  }

  if (body.prompt.length > GENERATION_CONSTRAINTS.prompt.maxLength) {
    return { success: false, error: `Prompt must be less than ${GENERATION_CONSTRAINTS.prompt.maxLength} characters` };
  }

  if (body.negative_prompt && typeof body.negative_prompt !== 'string') {
    return { success: false, error: 'Negative prompt must be a string' };
  }

  if (body.negative_prompt && body.negative_prompt.length > GENERATION_CONSTRAINTS.negative_prompt.maxLength) {
    return { success: false, error: `Negative prompt must be less than ${GENERATION_CONSTRAINTS.negative_prompt.maxLength} characters` };
  }

  if (body.count !== undefined) {
    if (!Number.isInteger(body.count) || body.count < GENERATION_CONSTRAINTS.count.min || body.count > GENERATION_CONSTRAINTS.count.max) {
      return { success: false, error: `Count must be an integer between ${GENERATION_CONSTRAINTS.count.min} and ${GENERATION_CONSTRAINTS.count.max}` };
    }
  }

  if (body.num_inference_steps !== undefined) {
    if (!Number.isInteger(body.num_inference_steps) || body.num_inference_steps < GENERATION_CONSTRAINTS.num_inference_steps.min || body.num_inference_steps > GENERATION_CONSTRAINTS.num_inference_steps.max) {
      return { success: false, error: `num_inference_steps must be an integer between ${GENERATION_CONSTRAINTS.num_inference_steps.min} and ${GENERATION_CONSTRAINTS.num_inference_steps.max}` };
    }
  }

  if (body.guidance_scale !== undefined) {
    if (typeof body.guidance_scale !== 'number' || body.guidance_scale < GENERATION_CONSTRAINTS.guidance_scale.min || body.guidance_scale > GENERATION_CONSTRAINTS.guidance_scale.max) {
      return { success: false, error: `guidance_scale must be a number between ${GENERATION_CONSTRAINTS.guidance_scale.min} and ${GENERATION_CONSTRAINTS.guidance_scale.max}` };
    }
  }

  if (body.height !== undefined) {
    if (!Number.isInteger(body.height) || body.height < GENERATION_CONSTRAINTS.height.min || body.height > GENERATION_CONSTRAINTS.height.max || body.height % GENERATION_CONSTRAINTS.height.step !== 0) {
      return { success: false, error: `height must be an integer between ${GENERATION_CONSTRAINTS.height.min} and ${GENERATION_CONSTRAINTS.height.max}, divisible by ${GENERATION_CONSTRAINTS.height.step}` };
    }
  }

  if (body.width !== undefined) {
    if (!Number.isInteger(body.width) || body.width < GENERATION_CONSTRAINTS.width.min || body.width > GENERATION_CONSTRAINTS.width.max || body.width % GENERATION_CONSTRAINTS.width.step !== 0) {
      return { success: false, error: `width must be an integer between ${GENERATION_CONSTRAINTS.width.min} and ${GENERATION_CONSTRAINTS.width.max}, divisible by ${GENERATION_CONSTRAINTS.width.step}` };
    }
  }

  if (body.seed !== undefined && (!Number.isInteger(body.seed) || body.seed < 0)) {
    return { success: false, error: 'seed must be a non-negative integer' };
  }

  return { success: true };
}

// Real RunPod image generation function
async function generateImagesWithRunPod(params: any, modelId: string, userId: string): Promise<string[]> {
  try {
    // First, get the model to get the RunPod URL and verify ownership
    const modelResult = await getModelByIdAndUserId(modelId, userId);
    
    if (!modelResult.success || !modelResult.data?.endpoint_url) {
      throw new Error('Model endpoint URL not found, model not ready, or unauthorized access');
    }

    const modelUrl = modelResult.data.endpoint_url;

    // Prepare the request payload for RunPod
    const requestPayload = {
      input: {
        prompt: params.prompt,
        negative_prompt: params.negative_prompt || "",
        num_inference_steps: params.num_inference_steps,
        guidance_scale: params.guidance_scale,
        width: params.width,
        height: params.height,
        seed: params.seed,
        count: params.count
      }
    };

    // Make POST request to RunPod
    const runpodApiKey = process.env.RUNPOD_API_KEY;
    if (!runpodApiKey) {
      throw new Error('RUNPOD_API_KEY environment variable is not set');
    }

    const response = await fetch(`${modelUrl}/runsync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runpodApiKey}`,
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`RunPod API request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();

    // Extract base64 images from RunPod response
    // RunPod typically returns: { output: { images: [...] } } or { output: [...] }
    const images = responseData.output?.images || responseData.output || responseData.images;
    
    if (!images || !Array.isArray(images)) {
      console.error('Unexpected RunPod response format:', responseData);
      throw new Error('Invalid response format: missing images array');
    }

    // Return raw base64 strings (without data URL prefix for API)
    const base64Images = images.map((image: string) => {
      // If image has data URL format, extract just the base64 part
      if (image.startsWith('data:image/')) {
        return image.split(',')[1]; // Remove data:image/png;base64, prefix
      }
      // Otherwise, assume it's already raw base64
      return image;
    });

    return base64Images;

  } catch (error) {
    console.error('RunPod generation failed:', error);
    throw error;
  }
}

// API Request/Response Types for Model Inference

export interface GenerateImageRequest {
  prompt: string;
  negative_prompt?: string;
  count?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  height?: number;
  width?: number;
  seed?: number;
}

export interface GenerateImageResponse {
  images: string[]; // base64 encoded images
  inference_time: number;
  parameters: {
    prompt: string;
    negative_prompt: string;
    count: number;
    num_inference_steps: number;
    guidance_scale: number;
    height: number;
    width: number;
    seed: number;
  };
}

export interface ApiErrorResponse {
  error: string;
}

// Default values for generation parameters
export const DEFAULT_GENERATION_PARAMS = {
  count: 1,
  num_inference_steps: 20,
  guidance_scale: 7.5,
  height: 1024,
  width: 1024,
  negative_prompt: '',
} as const;

// Validation constraints
export const GENERATION_CONSTRAINTS = {
  count: { min: 1, max: 4 },
  num_inference_steps: { min: 1, max: 50 },
  guidance_scale: { min: 1, max: 20 },
  height: { min: 256, max: 2048, step: 64 },
  width: { min: 256, max: 2048, step: 64 },
  prompt: { maxLength: 1000 },
  negative_prompt: { maxLength: 1000 },
} as const;

'use server';

import { captureException } from '@sentry/nextjs';

export interface RunPodTrainingRequest {
  dataset_bucket_path: string;
  model_bucket_path: string;
  steps: number;
  model_type: string;
  log_bucket_path: string;
  callback_url: string;
}

export interface RunPodTrainingResponse {
  id: string;
  status: string;
}

export interface RunPodErrorResponse {
  error: string;
  message?: string;
}

/**
 * Call RunPod training endpoint to start model training
 */
export async function startRunPodTraining(request: RunPodTrainingRequest): Promise<{
  success: boolean;
  data?: RunPodTrainingResponse;
  error?: string;
}> {
  try {
    const apiKey = process.env.RUNPOD_API_KEY;
    const endpoint = process.env.RUNPOD_TRAINING_ENDPOINT;
    if (!apiKey) {
      return { success: false, error: 'RunPod API key not configured' };
    }

    if (!endpoint) {
      return { success: false, error: 'RunPod training endpoint not configured' };
    }

    const response = await fetch(`${endpoint}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: request
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunPod API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      let errorMessage = `RunPod API error: ${response.status} ${response.statusText}`;
      try {
        const errorData: RunPodErrorResponse = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Use the default error message if parsing fails
      }

      return { success: false, error: errorMessage };
    }

    const data: RunPodTrainingResponse = await response.json();

    if (!data.id) {
      return { success: false, error: 'Invalid response from RunPod API: missing training run ID' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to start RunPod training:', error);
    captureException(error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error connecting to RunPod API' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get training job status from RunPod
 */
export async function getRunPodTrainingStatus(trainingRunId: string): Promise<{
  success: boolean;
  data?: { status: string;[key: string]: any };
  error?: string;
}> {
  try {
    const apiKey = process.env.RUNPOD_API_KEY;
    const endpoint = process.env.RUNPOD_TRAINING_ENDPOINT;

    if (!apiKey) {
      return { success: false, error: 'RunPod API key not configured' };
    }

    if (!endpoint) {
      return { success: false, error: 'RunPod training endpoint not configured' };
    }

    // RunPod status endpoint format: https://api.runpod.ai/v2/{pod_id}/status/{job_id}
    const statusEndpoint = `${endpoint}/status/${trainingRunId}`;

    const response = await fetch(statusEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunPod status API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      return {
        success: false,
        error: `RunPod status API error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to get RunPod training status:', error);
    captureException(error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Cancel training job on RunPod
 */
export async function cancelRunPodTraining(trainingRunId: string): Promise<{
  success: boolean;
  data?: { status: string;[key: string]: any };
  error?: string;
}> {
  try {
    const apiKey = process.env.RUNPOD_API_KEY;
    const endpoint = process.env.RUNPOD_TRAINING_ENDPOINT;

    if (!apiKey) {
      return { success: false, error: 'RunPod API key not configured' };
    }

    if (!endpoint) {
      return { success: false, error: 'RunPod training endpoint not configured' };
    }

    // RunPod cancel endpoint format: https://api.runpod.ai/v2/{pod_id}/cancel/{job_id}
    const cancelEndpoint = `${endpoint}/cancel/${trainingRunId}`;

    const response = await fetch(cancelEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunPod cancel API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      let errorMessage = `RunPod cancel API error: ${response.status} ${response.statusText}`;
      try {
        const errorData: RunPodErrorResponse = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Use the default error message if parsing fails
      }

      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to cancel RunPod training:', error);
    captureException(error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error connecting to RunPod API' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

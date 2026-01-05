import { NextRequest, NextResponse } from 'next/server';
import { getModelById, updateModel } from '@/lib/model/service';
import { validateWebhookAuth } from '@/lib/webhook-auth';

interface DeploymentFinishedRequest {
  endpoint_url: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the webhook request
    const authResponse = validateWebhookAuth(request);
    if (authResponse) {
      return authResponse; // Returns 401 if authentication fails
    }

    const { id } = await params;

    // Parse request body
    const body: DeploymentFinishedRequest = await request.json();

    if (!body.endpoint_url) {
      return NextResponse.json(
        { error: 'endpoint_url is required' },
        { status: 400 }
      );
    }

    // Fetch model from DB and update model.endpoint_url
    const modelResult = await getModelById(id);

    if (!modelResult.success || !modelResult.data) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    const model = modelResult.data;

    // Update model.endpoint_url with the RunPod endpoint
    const updateResult = await updateModel(id, model.user_id, {
      endpoint_url: body.endpoint_url,
      status: 'completed'
    });

    if (!updateResult.success) {
      console.error('Failed to update model:', updateResult.error);
      return NextResponse.json(
        { error: 'Failed to update model' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Model deployment completed and endpoint URL stored',
      model_id: id,
      endpoint_url: body.endpoint_url
    });

  } catch (error) {
    console.error('Error processing deployment finished webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getModelById, updateModel } from '@/lib/model/service';
import { validateWebhookAuth } from '@/lib/webhook-auth';

interface TrainingFinishedRequest {
  model_path: string;
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
    const body: TrainingFinishedRequest = await request.json();

    if (!body.model_path) {
      return NextResponse.json(
        { error: 'model_path is required' },
        { status: 400 }
      );
    }

    // Step 3: Fetch model from DB and update model.url
    const modelResult = await getModelById(id);

    if (!modelResult.success || !modelResult.data) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    const model = modelResult.data;

    // Update model.url with the model_path (R2 weights URL)
    const updateResult = await updateModel(id, model.user_id, {
      url: body.model_path,
      status: 'deploying',
      completed_at: new Date()
    });

    if (!updateResult.success) {
      console.error('Failed to update model:', updateResult.error);
      return NextResponse.json(
        { error: 'Failed to update model' },
        { status: 500 }
      );
    }

    // Step 4: Call GitHub Action to deploy model
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const githubRepo = process.env.GITHUB_REPO; // e.g., "username/repo-name"

      if (!githubToken || !githubRepo) {
        // Continue without failing the request - model weights are already stored
      } else {
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/models/${id}/deployment-finished`;

        // Call existing GitHub Action workflow using workflow dispatch
        const workflowName = process.env.GITHUB_WORKFLOW || 'build-and-deploy.yml'; // Set this to your existing workflow file

        const githubResponse = await fetch(`https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowName}/dispatches`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main', // or your default branch
            inputs: {
              model_url: body.model_path,
              webhook_url: callbackUrl
            }
          })
        });

        if (!githubResponse.ok) {
          const errorText = await githubResponse.text();
          console.error('Failed to trigger GitHub Action:', githubResponse.status, errorText);
        }
      }
    } catch (githubError) {
      console.error('Error calling GitHub Action:', githubError);
      // Continue without failing - model weights are already stored
    }

    return NextResponse.json({
      success: true,
      message: 'Model training completed and weights stored',
      model_id: id,
      model_path: body.model_path
    });

  } catch (error) {
    console.error('Error processing training finished webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

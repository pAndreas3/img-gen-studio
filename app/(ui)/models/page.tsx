import { auth } from '@/lib/auth';
import { getModelsByUserId } from '@/lib/model/service';
import ModelsClient, { Model } from './models-client';

export const dynamic = 'force-dynamic';

export default async function ModelsPage() {
  // Get the current session
  const session = await auth();
  
  // Initialize empty models array
  let dbModels: Model[] = [];
  
  // Fetch models from database if user is authenticated
  if (session?.user?.id) {
    try {
      const result = await getModelsByUserId(session.user.id);
      
      if (result.success && result.data) {
        // Transform database models to match the expected format
        dbModels = result.data.map((model: any) => ({
          id: model.id,
          name: model.name,
          description: model.description || "No description available",
          type: model.type,
          status: model.status || "pending",
          resolution: model.resolution || "512x512",
          createdAt: new Date(model.created_at),
          completedAt: model.completed_at ? new Date(model.completed_at) : null,
          trainingTime: model.training_time || 0,
          imagesCount: model.numberOfImages || 0,
          thumbnail: model.thumbnail || "/model-thumbnail.png",
        }));
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      // dbModels remains empty array, so we'll show only mock models
    }
  }

  return <ModelsClient dbModels={dbModels} />;
} 
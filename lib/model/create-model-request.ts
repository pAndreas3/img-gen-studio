export type CreateModelRequest = {
    name: string;
    description?: string;
    type: string;
    resolution?: string;
    training_steps?: number;
    estimated_time_minutes?: number;
    status?: string;
    thumbnail?: string;
    url?: string;                     // Model weights URL (from training)
    endpoint_url?: string;            // RunPod inference endpoint URL
    training_run_id?: string;         // RunPod training job ID
    completed_at?: Date;              // When training/deployment completed
    dataset_id: string;
    user_id: string;
  };
"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getModelAction, getTrainingStatusAction, cancelTrainingAction, getModelDownloadUrlAction } from "@/app/actions/model-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Clock,
  Zap,
  Sparkles,
  Gauge,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Share2,
  Settings,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"


interface TrainingData {
  id: string;
  modelName: string;
  description: string;
  modelType: string;
  resolution: string;
  totalSteps: number;
  currentStep: number;
  status: string;
  startTime: Date;
  estimatedTotalTime: number;
  imagesCount: number;
  learningRate: number;
  trainingRequestId?: string;
}

const getModelIcon = (type: string) => {
  switch (type) {
    case "small":
      return Zap
    case "high-quality":
      return Sparkles
    case "fast":
      return Gauge
    default:
      return Settings
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "training":
      return "bg-blue-500"
    case "deploying":
      return "bg-purple-500"
    case "completed":
      return "bg-green-500"
    case "cancelled":
      return "bg-orange-500"
    case "failed":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case "training":
      return "In Training"
    case "deploying":
      return "Deploying"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    case "failed":
      return "Failed"
    default:
      return "Unknown"
  }
}

interface TrainingDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TrainingDetailsPage({ params }: TrainingDetailsPageProps) {
  const { id } = use(params)
  
  const router = useRouter()
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modelData, setModelData] = useState<any>(null)
  const [cancelling, setCancelling] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Fetch model data from database
  const fetchModelData = async () => {
    try {
      const result = await getModelAction(id)
      
      if (result.success && result.data) {
        setModelData(result.data)
        return result.data
      } else {
        console.error('Failed to fetch model data:', result.error)
        return null
      }
    } catch (err) {
      console.error('Error fetching model data:', err)
      return null
    }
  }

  // Fetch training data from API
  const fetchTrainingData = async () => {
    try {
      // First, fetch model data from database
      const model = await fetchModelData()
      
      if (!model) {
        setError('Failed to fetch model data')
        setLoading(false)
        return
      }
      
      const trainingRunId = model.training_run_id
      
      // Check database status first - if model is completed, deploying, failed, cancelled, or training, show that status
      if (model.status === 'completed') {
        const completedData: TrainingData = {
          id: id,
          modelName: model.name || "Untitled Model",
          description: model.description || "No description available",
          modelType: model.type || "unknown",
          resolution: model.resolution || "512x512",
          totalSteps: model.training_steps || 0,
          currentStep: model.training_steps || 0, 
          status: "completed",
          startTime: model.created_at ? new Date(model.created_at) : new Date(),
          estimatedTotalTime: model.estimated_time_minutes || 0,
          imagesCount: model.numberOfImages || 0, 
          learningRate: 0.0001, 
          trainingRequestId: trainingRunId || undefined
        }
        setTrainingData(completedData)
        setError(null)
        setLoading(false)
        return
      }
      
      if (model.status === 'deploying') {
        // For deploying status, training is complete so show full progress
        const totalSteps = model.training_steps || 400
        const deployingData: TrainingData = {
          id: id,
          modelName: model.name || "Untitled Model",
          description: model.description || "No description available",
          modelType: model.type || "unknown",
          resolution: model.resolution || "512x512",
          totalSteps: totalSteps,
          currentStep: totalSteps, // Training is complete, show full progress
          status: "deploying",
          startTime: model.created_at ? new Date(model.created_at) : new Date(),
          estimatedTotalTime: model.estimated_time_minutes || 0,
          imagesCount: model.numberOfImages || 0, 
          learningRate: 0.0001, 
          trainingRequestId: trainingRunId || undefined
        }
        setTrainingData(deployingData)
        setError(null)
        setLoading(false)
        return
      }
      
      if (model.status === 'failed') {
        const failedData: TrainingData = {
          id: id,
          modelName: model.name || "Untitled Model",
          description: model.description || "No description available",
          modelType: model.type || "unknown",
          resolution: model.resolution || "512x512",
          totalSteps: model.training_steps || 0,
          currentStep: 0,
          status: "failed",
          startTime: model.created_at ? new Date(model.created_at) : new Date(),
          estimatedTotalTime: model.estimated_time_minutes || 0,
          imagesCount: model.numberOfImages || 0,
          learningRate: 0.0001, 
          trainingRequestId: trainingRunId || undefined
        }
        setTrainingData(failedData)
        setError(null)
        setLoading(false)
        return
      }
      
      if (model.status === 'cancelled') {
        const cancelledData: TrainingData = {
          id: id,
          modelName: model.name || "Untitled Model",
          description: model.description || "No description available",
          modelType: model.type || "unknown",
          resolution: model.resolution || "512x512",
          totalSteps: model.training_steps || 0,
          currentStep: 0,
          status: "cancelled",
          startTime: model.created_at ? new Date(model.created_at) : new Date(),
          estimatedTotalTime: model.estimated_time_minutes || 0,
          imagesCount: model.numberOfImages || 0,
          learningRate: 0.0001, 
          trainingRequestId: trainingRunId || undefined
        }
        setTrainingData(cancelledData)
        setError(null)
        setLoading(false)
        return
      }
      
      // Handle training status - show training data immediately with cancel button
      if (model.status === 'training') {
        const trainingData: TrainingData = {
          id: id,
          modelName: model.name || "Untitled Model",
          description: model.description || "No description available",
          modelType: model.type || "unknown",
          resolution: model.resolution || "512x512",
          totalSteps: model.training_steps || 0,
          currentStep: 0, 
          status: "training",
          startTime: model.created_at ? new Date(model.created_at) : new Date(),
          estimatedTotalTime: model.estimated_time_minutes || 0,
          imagesCount: model.numberOfImages || 0,
          learningRate: 0.0001, 
          trainingRequestId: trainingRunId || undefined
        }
        setTrainingData(trainingData)
        setError(null)
        setLoading(false)
        
        if (trainingRunId) {
          try {
            const result = await getTrainingStatusAction(trainingRunId, id)
            if (result.success && result.data) {
              const apiData = result.data
              const dbTotalSteps = model.training_steps || 0
              
              let currentStep = apiData.currentStep || 0
              let totalSteps = apiData.totalSteps || dbTotalSteps
              
              // Update the training data with real-time progress
              setTrainingData(prev => prev ? {
                ...prev,
                currentStep: currentStep,
                totalSteps: totalSteps,
                // Only update status if it's a valid training status, otherwise keep current status
                status: (apiData.status?.toLowerCase() === "training" || 
                        apiData.status?.toLowerCase() === "in_progress" || 
                        apiData.status?.toLowerCase() === "completed" || 
                        apiData.status?.toLowerCase() === "failed") 
                       ? apiData.status.toLowerCase() 
                       : prev.status
              } : null)
            }
          } catch (err) {
            console.error('Error fetching real-time training status:', err)
            // Keep the training data as is if API call fails
          }
        }
        return
      }
      
      // If no training_run_id, show pending status
      if (!trainingRunId) {
        const pendingData: TrainingData = {
          id: id,
          modelName: model.name || "Untitled Model",
          description: model.description || "No description available",
          modelType: model.type || "unknown",
          resolution: model.resolution || "512x512",
          totalSteps: model.training_steps || 0,
          currentStep: 0,
          status: "pending",
          startTime: model.created_at ? new Date(model.created_at) : new Date(),
          estimatedTotalTime: model.estimated_time_minutes || 0,
          imagesCount: model.numberOfImages || 0, 
          learningRate: 0.0001, 
          trainingRequestId: undefined
        }
        setTrainingData(pendingData)
        setError(null)
        setLoading(false)
        return
      }
      
      const result = await getTrainingStatusAction(trainingRunId, id)

      if (result.success && result.data) {
        const apiData = result.data
        const dbTotalSteps = model.training_steps || 0
        
        // For completed and deploying status, use database total steps and set current step to total
        let currentStep = apiData.currentStep || 0
        let totalSteps = apiData.totalSteps || dbTotalSteps
        
        if (apiData.status?.toLowerCase() === "completed" || apiData.status?.toLowerCase() === "deploying") {
          currentStep = dbTotalSteps
          totalSteps = dbTotalSteps
        }
        
        // Transform API data to our TrainingData format
        const transformedData: TrainingData = {
          id: id,
          modelName: model.name || "Untitled Model",
          description: model.description || "No description available",
          modelType: model.type || "unknown",
          resolution: model.resolution || "512x512",
          totalSteps: totalSteps,
          currentStep: currentStep,
          // Use database status as fallback if API status is invalid
          status: (apiData.status?.toLowerCase() === "training" || 
                  apiData.status?.toLowerCase() === "in_progress" || 
                  apiData.status?.toLowerCase() === "completed" || 
                  apiData.status?.toLowerCase() === "deploying" ||
                  apiData.status?.toLowerCase() === "failed") 
                 ? apiData.status.toLowerCase() 
                 : model.status || "unknown",
          startTime: model.created_at ? new Date(model.created_at) : new Date(),
          estimatedTotalTime: model.estimated_time_minutes || 0,
          imagesCount: model.numberOfImages || 0, 
          learningRate: 0.0001,
          trainingRequestId: trainingRunId || undefined
        }
        
        setTrainingData(transformedData)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch training data')
      }
    } catch (err) {
      setError('Network error fetching training data')
      console.error('Error fetching training data:', err)
    } finally {
      setLoading(false)
    }
  }


  const refreshProgressData = useCallback(async () => {
    // Get current training data from state to avoid stale closure
    setTrainingData(currentTrainingData => {
      if (!currentTrainingData || !currentTrainingData.trainingRequestId) return currentTrainingData;
      
      if (currentTrainingData.status !== "training" && currentTrainingData.status !== "in_progress") {
        return currentTrainingData;
      }
      
      getTrainingStatusAction(currentTrainingData.trainingRequestId, id)
        .then(result => {
          if (result.success && result.data) {
            const apiData = result.data;
            // Use the totalSteps from the current training data instead of modelData
            const dbTotalSteps = currentTrainingData.totalSteps || 0;
            
            let currentStep = apiData.currentStep || 0;
            let totalSteps = apiData.totalSteps || dbTotalSteps;
            
            // Update only the progress-related fields
            setTrainingData(prev => prev ? {
              ...prev,
              currentStep: currentStep,
              totalSteps: totalSteps,
              // Only update status if it's a valid training status, otherwise keep the current status
              status: (apiData.status?.toLowerCase() === "training" || 
                      apiData.status?.toLowerCase() === "in_progress" || 
                      apiData.status?.toLowerCase() === "completed" || 
                      apiData.status?.toLowerCase() === "failed") 
                     ? apiData.status.toLowerCase() 
                     : prev.status
            } : null);
          }
        })
        .catch(err => {
          console.error('Error refreshing progress data:', err);
        });
      
      return currentTrainingData;
    });
  }, [id]);

  // Cancel training function
  const handleCancelTraining = async () => {
    if (!trainingData) return;
    
    setCancelling(true);
    try {
      const result = await cancelTrainingAction(id);
      
      if (result.success) {
        // Update status to cancelled immediately for better UX
        setTrainingData(prev => prev ? {
          ...prev,
          status: 'cancelled'
        } : null);
      } else {
        setError(result.error || 'Failed to cancel training');
      }
    } catch (err) {
      console.error('Error cancelling training:', err);
      setError('Failed to cancel training');
    } finally {
      setCancelling(false);
    }
  };

  // Download model function
  const handleDownloadModel = async () => {
    if (!trainingData || trainingData.status !== 'completed') return;
    
    setDownloading(true);
    try {
      const result = await getModelDownloadUrlAction(id);
      
      if (result.success && result.data) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = result.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError(result.error || 'Failed to prepare model download');
      }
    } catch (err) {
      setError('Failed to download model');
    } finally {
      setDownloading(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    // Initial fetch
    fetchTrainingData()
    
    // Only set up interval for auto-refresh if model is in active state
    // Terminal states: completed, failed, cancelled
    const isTerminalState = trainingData?.status === 'completed' || 
                           trainingData?.status === 'failed' || 
                           trainingData?.status === 'cancelled';
    
    if (isTerminalState) {
      // Don't set up interval for terminal states
      return;
    }
    
    const interval = setInterval(() => {
      refreshProgressData()
    }, 5000) // Refresh every 5 seconds

    return () => {
      clearInterval(interval)
    }
  }, [refreshProgressData, trainingData?.status])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading training data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !trainingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Training Data</h2>
          <p className="text-muted-foreground mb-4">{error || 'No training data available'}</p>
          <Button onClick={() => fetchTrainingData()}>Retry</Button>
        </div>
      </div>
    )
  }

  const progress = trainingData.totalSteps > 0 ? (trainingData.currentStep / trainingData.totalSteps) * 100 : 0
  const ModelIcon = getModelIcon(trainingData.modelType)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Page Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push('/models')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <Badge variant="outline" className={cn("text-white", getStatusColor(trainingData.status))}>
            {getStatusText(trainingData.status)}
          </Badge>
        </div>

        {/* Model Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold mb-1">{trainingData.modelName}</h2>
              <p className="text-muted-foreground text-sm max-w-2xl">{trainingData.description}</p>
            </div>
            <div className="flex gap-2">
              {trainingData.status === "completed" && (
                <>
                  <Link href={`/models/${trainingData.id}/preview`}>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Eye className="w-4 h-4" />
                      Use model
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="gap-2 bg-transparent"
                    onClick={handleDownloadModel}
                    disabled={downloading}
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? "Downloading..." : "Download"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Training Progress */}
          <div className="lg:col-span-2 space-y-4">
            {/* Progress Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-4 h-4" />
                  Training Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Step {Math.floor(trainingData.currentStep)} of {trainingData.totalSteps}
                    </span>
                    <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" indicatorColor="bg-gradient-to-r from-purple-600 to-blue-600" />
                </div>


                {(trainingData.status === "training" || trainingData.status === "in_progress") && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="w-4 h-4 animate-spin" />
                    Training in progress... Step {trainingData.currentStep} of {trainingData.totalSteps}
                  </div>
                )}

                {trainingData.status === "deploying" && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Clock className="w-4 h-4 animate-pulse" />
                    Deploying model... This may take a few minutes.
                  </div>
                )}

                {(trainingData.status === "completed" || trainingData.status === "finished") && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Training completed successfully!
                  </div>
                )}

                {(trainingData.status === "failed" || trainingData.status === "error") && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    Training failed. Please check the details for more information.
                  </div>
                )}

                {trainingData.status === "cancelled" && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    Training was cancelled.
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Model Details Sidebar */}
          <div className="space-y-4">
            {/* Model Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ModelIcon className="w-4 h-4" />
                  Model Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Model Type</span>
                    <span className="text-sm font-medium capitalize">{trainingData.modelType.replace("-", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Resolution</span>
                    <span className="text-sm font-medium">{trainingData.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Training Images</span>
                    <span className="text-sm font-medium">{trainingData.imagesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Learning Rate</span>
                    <span className="text-sm font-medium">{trainingData.learningRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Steps</span>
                    <span className="text-sm font-medium">{trainingData.totalSteps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm font-medium">{trainingData.startTime.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Actions */}
            {trainingData.status === "training" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Training Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="destructive" 
                    className="w-full gap-2"
                    onClick={handleCancelTraining}
                    disabled={cancelling}
                  >
                    <X className="w-4 h-4" />
                    {cancelling ? "Cancelling..." : "Cancel Training"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
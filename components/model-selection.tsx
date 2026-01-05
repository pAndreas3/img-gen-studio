'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, Sparkles, Clock, Upload, Image, Settings, Play, Loader2 } from 'lucide-react';
import { startModelTraining } from '../app/actions/model-actions';
import { generateZipUploadUrl, createDatasetFromZipUpload } from '../app/actions/dataset-actions';
import { createZipFromFiles, formatFileSize, getTotalFileSize } from '../lib/zip-utils';

interface ModelOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  resolution: string;
  features: string[];
}

const modelOptions: ModelOption[] = [
  {
    id: "quality",
    title: "High Quality",
    description: "Best results with detailed, professional outputs",
    icon: Sparkles,
    resolution: "1024x1024",
    features: [
      "Superior image quality",
      "Fine details",
      "Professional results"
    ]
  },
  {
    id: "fast",
    title: "Fast Model",
    description: "Balanced speed and quality for production use",
    icon: Clock,
    resolution: "512x512",
    features: [
      "Optimized performance",
      "Good quality",
      "Production ready"
    ]
  }
];

export default function ModelSelection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [trainingSteps, setTrainingSteps] = useState([1000]);
  const [learningRate, setLearningRate] = useState([0.0001]);
  const [isStartingTraining, setIsStartingTraining] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [zipProgress, setZipProgress] = useState<{ status: string; progress?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clean up old URLs
    imageUrls.forEach(url => URL.revokeObjectURL(url));
    // Create new URLs
    const newUrls = uploadedFiles.map(file => URL.createObjectURL(file));
    setImageUrls(newUrls);
    // Cleanup function
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploadedFiles]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
      const newFiles = Array.from(files);
      const validFiles = newFiles.filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        return validTypes.includes(file.type) && file.size <= maxSize;
      });

      if (validFiles.length !== newFiles.length) {
        // Show error message for invalid files
        console.warn(`${newFiles.length - validFiles.length} files were skipped (invalid type or too large)`);
      }

      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const calculateTrainingTime = () => {
    const baseTime = selectedModel === 'quality' ? 8 : selectedModel === 'fast' ? 3 : 5;
    const stepsMultiplier = trainingSteps[0] / 1000;
    const imageMultiplier = Math.max(1, uploadedFiles.length / 20);
    return Math.round(baseTime * stepsMultiplier * imageMultiplier);
  };

  const uploadZipToR2 = async (files: File[], userId: string, datasetId: string) => {
    try {
      // Step 1: Create ZIP file
      setIsCreatingZip(true);
      setZipProgress({ status: 'Compressing images into ZIP archive...' });
      const zipFile = await createZipFromFiles(files, `dataset-${datasetId}`);
      setZipProgress({ status: 'ZIP created successfully!', progress: 100 });

      // Step 2: Upload ZIP to R2
      setIsCreatingZip(false);
      setIsUploadingFiles(true);
      setZipProgress({ status: 'Uploading ZIP to cloud storage...' });

      try {
        // Get presigned upload URL for ZIP file
        const { url, key } = await generateZipUploadUrl(datasetId, zipFile.name);

        // Upload ZIP file to R2 with timeout
        const uploadRes = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/zip",
            "Content-Length": zipFile.size.toString()
          },
          body: zipFile,
          signal: AbortSignal.timeout(300000) // 5 minutes timeout for ZIP files
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text().catch(() => 'Unknown upload error');
          throw new Error(`Failed to upload ZIP to R2: ${uploadRes.status} ${uploadRes.statusText}. Response: ${errorText}`);
        }

        return { zipKey: key, imageCount: files.length };
      } catch (networkError) {
        // Check for network/CORS issues
        if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
          throw new Error(`Network error uploading ZIP. This might be due to CORS configuration in your R2 bucket or network connectivity issues.`);
        }
        if (networkError instanceof Error && networkError.name === 'TimeoutError') {
          throw new Error(`Upload timeout for ZIP file. File might be too large or connection is slow.`);
        }
        throw networkError;
      }
    } catch (error) {
      console.error('ZIP upload failed:', error);
      throw error;
    } finally {
      setIsCreatingZip(false);
      setIsUploadingFiles(false);
      setZipProgress(null);
    }
  };

  const handleStartTraining = async () => {
    if (!selectedModel || !modelName.trim() || uploadedFiles.length < 10) {
      return;
    }

    if (!session?.user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsStartingTraining(true);
    setError(null);

    try {
      // Find the selected model to get its resolution
      const selectedModelOption = modelOptions.find(model => model.id === selectedModel);
      if (!selectedModelOption) {
        throw new Error('Selected model not found');
      }

      // Step 1: Generate a dataset ID for organizing uploads
      const datasetId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      let zipResult: { zipKey: string; imageCount: number };

      try {
        zipResult = await uploadZipToR2(uploadedFiles, session.user.id, datasetId);
      } catch (uploadError) {
        throw new Error(`Failed to upload ZIP to cloud storage: ${uploadError instanceof Error ? uploadError.message : 'Unknown upload error'}. Training cannot proceed without successful image upload.`);
      }

      // Step 2: Create dataset in database with ZIP file info
      let datasetResult;

      try {
        datasetResult = await createDatasetFromZipUpload(
          zipResult.zipKey,
          zipResult.imageCount,
          `${modelName.trim()} Dataset`
        );
      } catch (datasetError) {
        throw new Error(`Failed to create dataset record: ${datasetError instanceof Error ? datasetError.message : 'Unknown dataset error'}`);
      }

      // Step 3: Start model training with the created dataset
      const trainingResult = await startModelTraining({
        name: modelName.trim(),
        description: modelDescription.trim() || undefined,
        type: selectedModel,
        resolution: selectedModelOption.resolution,
        training_steps: trainingSteps[0],
        estimated_time_minutes: calculateTrainingTime(),
        dataset_id: datasetResult.dataset?.id! // Use the actual created dataset ID
      });

      // Handle successful training start
      if (trainingResult.success && trainingResult.data?.modelId) {
        // Redirect to model training details page
        router.push(`/models/${trainingResult.data.modelId}`);
        return;
      } else {
        throw new Error('Failed to start training');
      }
    } catch (err) {
      console.error('Failed to start training:', err);
      setError(err instanceof Error ? err.message : 'Failed to start training');
      setIsStartingTraining(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Model Selection */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Choose Your Model</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {modelOptions.map((model) => {
            const IconComponent = model.icon;
            const isSelected = selectedModel === model.id;

            return (
              <Card
                key={model.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
                  ? 'border-purple-500 border-2 bg-purple-50/50 dark:bg-purple-950/20'
                  : 'hover:border-purple-300'
                  }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${isSelected
                      ? 'bg-purple-500 text-white'
                      : 'bg-primary/10 text-primary'
                      }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{model.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {model.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium text-sm">Resolution:</span>
                      <span className="ml-2 text-sm text-muted-foreground">{model.resolution}</span>
                    </div>

                    <ul className="space-y-2">
                      {model.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-500' : 'bg-primary/60'
                            }`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>


      </div>

      {/* Both Upload and Training Settings appear when model is selected */}
      {selectedModel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Upload Training Images</h2>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>

                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Drop your images here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload 10-100 high-quality images (JPG, PNG, WebP)
                  </p>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Show uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Uploaded Images ({uploadedFiles.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={imageUrls[index]}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>

                {uploadedFiles.length >= 10 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      🎉 Great! You've uploaded {uploadedFiles.length} images. You can add more or proceed to training.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      📦 Images will be compressed into a ZIP file before upload ({formatFileSize(getTotalFileSize(uploadedFiles))})
                    </p>
                  </div>
                )}

                {/* ZIP Progress Indicator */}
                {zipProgress && (
                  <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          {zipProgress.status}
                        </p>
                        {zipProgress.progress !== undefined && (
                          <div className="mt-2 w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${zipProgress.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Training Settings Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Training Settings</h2>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Model Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-name">Model Name</Label>
                    <Input
                      id="model-name"
                      placeholder="e.g., My Custom Style, Pet Photos"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Give your model a descriptive name</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model-description">Model Description</Label>
                    <Textarea
                      id="model-description"
                      placeholder="Describe what your model will generate..."
                      value={modelDescription}
                      onChange={(e) => setModelDescription(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Training Steps */}
                <div className="space-y-3">
                  <Label>Training Steps: {trainingSteps[0]}</Label>
                  <Slider
                    value={trainingSteps}
                    onValueChange={setTrainingSteps}
                    max={4000}
                    min={400}
                    step={100}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">More steps = better quality, longer training time</p>
                </div>

                {/* Estimated Training Time */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Estimated Training Time: {calculateTrainingTime()} minutes</p>
                </div>
              </CardContent>
            </Card>

            {/* Start Training Button */}
            <div className="mt-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
                        disabled={!selectedModel || uploadedFiles.length < 10 || !modelName.trim() || isStartingTraining || isUploadingFiles || isCreatingZip}
                        onClick={handleStartTraining}
                      >
                        {isCreatingZip ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating ZIP...
                          </>
                        ) : isUploadingFiles ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Uploading ZIP...
                          </>
                        ) : isStartingTraining ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Starting Training...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-5 w-5" />
                            Start Training
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {(!selectedModel || uploadedFiles.length < 10 || !modelName.trim()) && (
                    <TooltipContent>
                      <p>
                        {!selectedModel
                          ? "Please select a model type"
                          : uploadedFiles.length < 10
                            ? `Please upload at least 10 images (${uploadedFiles.length}/10)`
                            : "Please enter a model name"}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <p className="text-center text-sm text-muted-foreground">
                Training will begin once you click start.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
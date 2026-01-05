"use client"

import { useState, use, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Download,
  Share2,
  RefreshCw,
  Settings,
  Zap,
  Gauge,
  Clock,
  Calendar,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getModelForPreview, getModelDownloadUrlAction } from "../../../../actions/model-actions"

// Interface for base64 images
interface Base64ImageData {
  id: string;
  base64: string;
  alt?: string;
}

// Interface for model data from database
interface ModelData {
  id: string;
  url: string | null;
  endpoint_url: string | null;
  name: string;
  description: string | null;
  type: string;
  resolution: string | null;
  training_steps: number | null;
  estimated_time_minutes: number | null;
  status: string | null;
  thumbnail: string | null;
  created_at: Date | null;
  completed_at: Date | null;
  dataset_id: string;
  user_id: string;
}

// Simple function to parse JSON and format base64 images
function loadBase64ImagesFromJson(jsonData: string): Base64ImageData[] {
  try {
    const response = JSON.parse(jsonData);
    return response.images.map((base64Image: string, index: number) => {
      // Ensure proper data URL format
      const formattedBase64 = base64Image.startsWith('data:image/') 
        ? base64Image 
        : `data:image/png;base64,${base64Image}`;

      return {
        id: (index + 1).toString(),
        base64: formattedBase64,
        alt: `Generated image ${index + 1} - ${response.parameters.prompt}`
      };
    });
  } catch (error) {
    console.error('Error parsing JSON data:', error);
    return [];
  }
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
      return Sparkles
  }
}

interface ModelPreviewPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ModelPreviewPage({ params }: ModelPreviewPageProps) {
  const { id } = use(params)
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Base64ImageData[]>([])
  const [settings, setSettings] = useState({
    steps: [20],
    guidance: [7.5],
    seed: [-1], // -1 for random
    imageCount: [4],
  })
  const [showSettings, setShowSettings] = useState(false)
  const [modelData, setModelData] = useState<ModelData | null>(null)
  const [isLoadingModel, setIsLoadingModel] = useState(true)
  const [modelError, setModelError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // Load model data on component mount
  useEffect(() => {
    async function loadModel() {
      try {
        setIsLoadingModel(true)
        setModelError(null)
        const model = await getModelForPreview(id)
        setModelData(model)
      } catch (error) {
        console.error('Error loading model:', error)
        setModelError(error instanceof Error ? error.message : 'Failed to load model')
      } finally {
        setIsLoadingModel(false)
      }
    }

    loadModel()
  }, [id])

  // Ensure defaults for fast models: steps range 1-10, default 5
  useEffect(() => {
    if (!modelData) return
    if (modelData.type === "fast") {
      setSettings((prev) => {
        const shouldSetDefaultSteps = prev.steps[0] === 20 // initial default for non-fast
        return shouldSetDefaultSteps ? { ...prev, steps: [5] } : prev
      })
    }
  }, [modelData])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    // Check if model data is loaded and has a URL
    if (!modelData) {
      alert('Model data is not loaded yet. Please wait.')
      return
    }
    
    if (!modelData.endpoint_url) {
      alert('Model endpoint URL is not available. The model may not be fully trained yet.')
      return
    }

    setIsGenerating(true)

    try {
      // Step 1: Prepare the request payload for RunPod
      const requestPayload = {
        input: {
          prompt: prompt.trim(),
          negative_prompt: negativePrompt.trim() || "",
          num_inference_steps: settings.steps[0],
          guidance_scale: modelData.type === "fast" ? 0 : settings.guidance[0],
          width: modelData.type === "fast" ? 512 : 1024,
          height: modelData.type === "fast" ? 512 : 1024,
          seed: settings.seed[0] === -1 ? Math.floor(Math.random() * 1000000) : settings.seed[0],
          count: settings.imageCount[0]
        }
      }

      // Step 2: Make POST request to model.endpoint_url + "/runsync"
      const apiUrl = `${modelData.endpoint_url}/runsync`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      })

      // Step 3: Check if response is successful
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      // Step 4: Parse the response
      const responseData = await response.json()

      // Step 5: Process the RunPod response and extract base64 images
      let base64Images: Base64ImageData[] = []

      // RunPod typically returns: { output: { images: [...] } } or { output: [...] }
      const images = responseData.output?.images || responseData.output || responseData.images
      
      if (images && Array.isArray(images)) {
        base64Images = images.map((base64Image: string, index: number) => {
          // Ensure proper data URL format
          const formattedBase64 = base64Image.startsWith('data:image/') 
            ? base64Image 
            : `data:image/png;base64,${base64Image}`

          return {
            id: (index + 1).toString(),
            base64: formattedBase64,
            alt: `Generated image ${index + 1} - ${prompt}`
          }
        })
      } else {
        console.error('Unexpected response format:', responseData)
        throw new Error('Invalid response format: missing images array')
      }

      setGeneratedImages(base64Images)

    } catch (error) {
      console.error('Error generating images:', error)
      
      // Show user-friendly error message
      alert(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Fallback to mock images for development/demo purposes
      try {
        const fallbackResponse = await fetch('/mock-inference-response.json')
        const jsonText = await fallbackResponse.text()
        const fallbackImages = loadBase64ImagesFromJson(jsonText)
        const imageCount = settings.imageCount[0]
        const imagesToShow = fallbackImages.slice(0, imageCount)
        setGeneratedImages(imagesToShow)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setGeneratedImages([])
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const ModelIcon = getModelIcon(modelData?.type || "high-quality")

  const handleDownloadModel = async () => {
    if (!modelData || modelData.status !== 'completed') return
    setDownloading(true)
    try {
      const result = await getModelDownloadUrlAction(id)
      if (result.success && result.data) {
        const link = document.createElement('a')
        link.href = result.data.downloadUrl
        link.download = result.data.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert(result.error || 'Failed to prepare model download')
      }
    } catch (err) {
      console.error('Error downloading model:', err)
      alert('Failed to download model')
    } finally {
      setDownloading(false)
    }
  }

  // Show loading state
  if (isLoadingModel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/models">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Models
              </Button>
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
              <p className="text-lg font-medium mb-2">Loading model...</p>
              <p className="text-sm text-gray-600">Please wait while we fetch your model data</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (modelError || !modelData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/models">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Models
              </Button>
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-lg font-medium mb-2 text-red-600">Error loading model</p>
              <p className="text-sm text-gray-600">{modelError || 'Model not found'}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/models">
              <Button variant="ghost" size="sm" >
                <ArrowLeft className="w-4 h-4" />
                Back to Models
              </Button>
            </Link>
          </div>
        </div>
      

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Model Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={modelData.thumbnail || "/model-thumbnail.png"}
                alt={modelData.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold truncate">{modelData.name}</h2>
                    <Badge className={`text-white text-xs ${
                      modelData.status === 'completed' ? 'bg-green-500' : 
                      modelData.status === 'training' ? 'bg-blue-500' : 
                      'bg-gray-500'
                    }`}>
                      {modelData.status ? modelData.status.charAt(0).toUpperCase() + modelData.status.slice(1) : 'Unknown'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2 text-sm">{modelData.description || 'No description available'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <ModelIcon className="w-4 h-4" />
                      <span className="capitalize">{modelData.type.replace("-", " ")}</span>
                    </div>
                    {modelData.completed_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(modelData.completed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {modelData.estimated_time_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{modelData.estimated_time_minutes}m training</span>
                      </div>
                    )}
                    {modelData.resolution && <span>{modelData.resolution}</span>}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    className="gap-2 bg-transparent"
                    onClick={handleDownloadModel}
                    disabled={downloading || modelData.status !== 'completed'}
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Downloading...' : 'Download'}
                  </Button>
                  <Link href={`/models/${id}`}>
                    <Button variant="outline" className="gap-2 bg-transparent w-full">
                      <Settings className="w-4 h-4" />
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-4">
            {/* Prompt Input */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Generate Images
                </CardTitle>
                <CardDescription>Enter a prompt to generate images with your trained model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    Prompt
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 min-h-[80px] resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="negative-prompt" className="text-sm font-medium">
                    Negative Prompt (Optional)
                  </Label>
                  <Textarea
                    id="negative-prompt"
                    placeholder="What you don't want in the image..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2 flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrompt("")
                      setNegativePrompt("")
                      setGeneratedImages([])
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const randomPrompts = [
                        "A beautiful portrait in vibrant colors",
                        "Artistic landscape with dramatic lighting",
                        "Abstract composition with flowing forms",
                        "Detailed character study with rich textures",
                        "Mystical forest scene with ethereal lighting",
                        "Urban cityscape at golden hour",
                      ]
                      const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)]
                      setPrompt(randomPrompt)
                    }}
                    className="gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Random
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Generation Settings
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showSettings && "rotate-180")} />
                </CardTitle>
              </CardHeader>
              {showSettings && (
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Image Count: {settings.imageCount[0]}</Label>
                    <Slider
                      value={settings.imageCount}
                      onValueChange={(value) => setSettings((prev) => ({ ...prev, imageCount: value }))}
                      max={4}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of images to generate</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Inference Steps: {settings.steps[0]}</Label>
                    <Slider
                      value={settings.steps}
                      onValueChange={(value) => setSettings((prev) => ({ ...prev, steps: value }))}
                      max={modelData.type === "fast" ? 10 : 50}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">More steps = higher quality, slower generation</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Guidance Scale: {modelData.type === "fast" ? "0 (disabled for fast models)" : settings.guidance[0]}
                    </Label>
                    <Slider
                      value={modelData.type === "fast" ? [0] : settings.guidance}
                      onValueChange={(value) => {
                        if (modelData.type !== "fast") {
                          setSettings((prev) => ({ ...prev, guidance: value }))
                        }
                      }}
                      max={20}
                      min={1}
                      step={0.5}
                      className={`mt-2 ${modelData.type === "fast" ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={modelData.type === "fast"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {modelData.type === "fast" 
                        ? "Fast models use guidance scale 0 for optimal performance" 
                        : "How closely to follow the prompt"
                      }
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seed" className="text-sm font-medium">
                      Seed
                    </Label>
                    <Input
                      id="seed"
                      type="number"
                      placeholder="Random (-1)"
                      value={settings.seed[0] === -1 ? "" : settings.seed[0]}
                      onChange={(e) => {
                        const value = e.target.value === "" ? -1 : Number.parseInt(e.target.value)
                        setSettings((prev) => ({ ...prev, seed: [value] }))
                      }}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use -1 for random seed</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right Column - Generated Images */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            {(generatedImages.length > 0 || isGenerating) ? (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Generated Images</CardTitle>
                  <CardDescription>
                    {isGenerating ? "Generating your images..." : `${generatedImages.length} images generated`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: settings.imageCount[0] }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center animate-pulse"
                        >
                          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {generatedImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={image.base64}
                              alt={image.alt || `Generated image ${image.id}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="gap-1"
                              onClick={() => {
                                // Download the base64 image
                                const link = document.createElement('a')
                                link.href = image.base64
                                link.download = `generated-image-${image.id}-${Date.now()}.png`
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <Wand2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No images generated yet</p>
                  <p className="text-sm">Enter a prompt and click Generate to see your images here</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
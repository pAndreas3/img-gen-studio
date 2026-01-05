"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Filter, Download, Eye, Calendar, Clock, MoreHorizontal, Plus, Sparkles, Zap, Gauge, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils"
import Link from "next/link"
import { deleteModelAction, getModelDownloadUrlAction } from "../../actions/model-actions"

// Define the model type
export type Model = {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  resolution: string;
  createdAt: Date;
  completedAt: Date | null;
  trainingTime: number;
  imagesCount: number;
  thumbnail: string;
}

interface ModelsClientProps {
  dbModels: Model[];
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "training":
      return "bg-blue-500 text-white"
    case "completed":
      return "bg-green-500 text-white"
    case "failed":
      return "bg-red-500 text-white"
    case "deploying":
      return "bg-purple-500 text-white"
    case "cancelled":
      return "bg-orange-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "training":
      return "Training"
    case "completed":
      return "Completed"
    case "failed":
      return "Failed"
    case "deploying":
      return "Deploying"
    case "cancelled":
      return "Cancelled"
    default:
      return "Unknown"
  }
}

export default function ModelsClient({ dbModels }: ModelsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [models, setModels] = useState<Model[]>(dbModels)
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())

  const handleDeleteModel = async () => {
    if (!modelToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteModelAction(modelToDelete.id)
      
      if (result.success) {
        // Remove the model from the local state
        setModels(prev => prev.filter(model => model.id !== modelToDelete.id))
        toast.success(`Model "${modelToDelete.name}" deleted successfully`)
      } else {
        toast.error(result.error || 'Failed to delete model')
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      toast.error('Failed to delete model')
    } finally {
      setIsDeleting(false)
      setModelToDelete(null)
    }
  }

  const handleDownloadModel = async (model: Model) => {
    if (model.status !== 'completed') {
      toast.error('Model is not ready for download yet')
      return
    }

    setDownloadingModels(prev => new Set(prev).add(model.id))
    try {
      const result = await getModelDownloadUrlAction(model.id)
      
      if (result.success && result.data) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a')
        link.href = result.data.downloadUrl
        link.download = result.data.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Downloading "${model.name}"...`)
      } else {
        toast.error(result.error || 'Failed to prepare model download')
      }
    } catch (err) {
      console.error('Error downloading model:', err)
      toast.error('Failed to download model')
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev)
        newSet.delete(model.id)
        return newSet
      })
    }
  }

  // Use only database models
  const allModels = models

  const filteredModels = allModels.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || model.status === statusFilter
    const matchesType = typeFilter === "all" || model.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Models</h2>
            <p className="text-muted-foreground">
              Manage and view all your trained Stable Diffusion models
              {models.length > 0 && ` • ${models.length} model${models.length === 1 ? '' : 's'} from database`}
            </p>
          </div>
          <Link href="/models/train">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Train New Model
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="deploying">Deploying</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="high-quality">High Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => {
            const ModelIcon = getModelIcon(model.type)
            const isDbModel = models.some(dbModel => dbModel.id === model.id)

            return (
              <Card key={model.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer bg-card">
                <Link href={`/models/${model.id}`}>
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                    <img
                      src={model.thumbnail || "/model-thumbnail.png"}
                      alt={model.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={cn("text-xs", getStatusColor(model.status))}>
                        {getStatusText(model.status)}
                      </Badge>
                      {isDbModel && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          DB
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="w-8 h-8 bg-background/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <ModelIcon className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </Link>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/models/${model.id}`}>
                        <h3 className="font-semibold text-lg hover:text-purple-600 transition-colors">
                          {model.name}
                        </h3>
                      </Link>
                      <CardDescription className="text-sm mt-1 line-clamp-2">{model.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/models/${model.id}/preview`} className="flex items-center gap-2 cursor-pointer">
                            <Eye className="w-4 h-4" />
                            Use Model
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => handleDownloadModel(model)}
                          disabled={downloadingModels.has(model.id) || model.status !== 'completed'}
                        >
                          <Download className="w-4 h-4" />
                          {downloadingModels.has(model.id) ? "Downloading..." : "Download"}
                        </DropdownMenuItem>
                        {isDbModel && (
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700"
                            onClick={() => setModelToDelete(model)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {model.createdAt.toLocaleDateString()}
                      </span>
                      <span className="capitalize">{model.type.replace("-", " ")}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{model.imagesCount} images</span>
                      <span>{model.resolution}</span>
                    </div>

                    {model.status === "completed" && (
                      <div className="flex gap-2 pt-2">
                        <Link href={`/models/${model.id}/preview`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1">
                            <Eye className="w-3 h-3" />
                            Use Model
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-1"
                          onClick={() => handleDownloadModel(model)}
                          disabled={downloadingModels.has(model.id)}
                        >
                          <Download className="w-3 h-3" />
                          {downloadingModels.has(model.id) ? "Downloading..." : "Download"}
                        </Button>
                      </div>
                    )}

                    {model.status === "deploying" && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-md">
                          <Clock className="w-3 h-3 animate-pulse" />
                          Deploying... This may take a few minutes.
                        </div>
                      </div>
                    )}

                    {model.status === "failed" && (
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          Retry Training
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No models found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by training your first model"}
            </p>
            <Link href="/models/train">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Train Your First Model
              </Button>
            </Link>
          </div>
        )}

        {/* Stats Summary */}
        {filteredModels.length > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {allModels.filter((m) => m.status === "completed").length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {allModels.filter((m) => m.status === "training").length}
                </div>
                <div className="text-sm text-muted-foreground">Training</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {allModels.filter((m) => m.status === "deploying").length}
                </div>
                <div className="text-sm text-muted-foreground">Deploying</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground">{allModels.length}</div>
                <div className="text-sm text-muted-foreground">Total Models</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!modelToDelete} onOpenChange={() => setModelToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Model</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{modelToDelete?.name}"? This action cannot be undone and will permanently remove the model and its associated files.
                {modelToDelete?.status === 'training' && (
                  <span className="block mt-2 text-amber-600 font-medium">
                    ⚠️ Any ongoing training will be cancelled.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setModelToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteModel}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
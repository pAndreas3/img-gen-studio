'use client';

import { useState } from 'react';
import { Card } from './card';
import { Button } from './button';
import { Download, Expand, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from './dialog';

export interface Base64Image {
  id: string;
  base64: string;
  alt?: string;
}

interface Base64ImageGalleryProps {
  images: Base64Image[];
  prompt?: string;
  className?: string;
}

export function Base64ImageGallery({ images, prompt, className }: Base64ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Base64Image | null>(null);

  const downloadImage = (image: Base64Image) => {
    try {
      // Create a temporary link to download the base64 image
      const link = document.createElement('a');
      link.href = image.base64;
      link.download = `generated-image-${image.id}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const copyBase64 = async (base64: string) => {
    try {
      await navigator.clipboard.writeText(base64);
      // You could add a toast notification here
      console.log('Base64 copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Ensure base64 string has proper data URL format
  const formatBase64 = (base64: string): string => {
    if (base64.startsWith('data:image/')) {
      return base64;
    }
    return `data:image/png;base64,${base64}`;
  };

  return (
    <div className={className}>
      {prompt && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Generated Images</h2>
          <p className="text-sm text-muted-foreground">
            Prompt: "{prompt}"
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {images.map((image) => {
          const formattedBase64 = formatBase64(image.base64);
          
          return (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative group">
                {/* Direct base64 image display */}
                <img
                  src={formattedBase64}
                  alt={image.alt || `Generated image ${image.id}`}
                  className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105"
                  style={{ maxHeight: '512px' }}
                />
                
                {/* Overlay with controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex gap-2">
                      {/* Expand/Zoom button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedImage(image)}
                          >
                            <Expand className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
                          {selectedImage && (
                            <div className="relative">
                              <img
                                src={formatBase64(selectedImage.base64)}
                                alt={selectedImage.alt || `Generated image ${selectedImage.id}`}
                                className="w-full h-auto max-h-[80vh] object-contain"
                              />
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {/* Copy base64 button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => copyBase64(formattedBase64)}
                        title="Copy base64 to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      {/* Download button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => downloadImage({ ...image, base64: formattedBase64 })}
                        title="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3">
                <p className="text-xs text-muted-foreground">
                  Image {image.id}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base64 size: {Math.round(image.base64.length / 1024)}KB
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Base64ImageGallery;

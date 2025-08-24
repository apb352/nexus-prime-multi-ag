import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Palette,
  Expand
} from '@phosphor-icons/react';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  style: string;
}

interface ImageViewerProps {
  images: GeneratedImage[];
  onRemoveImage?: (id: string) => void;
  className?: string;
}

export function ImageViewer({ images, onRemoveImage, className = '' }: ImageViewerProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const downloadImage = (image: GeneratedImage) => {
    if (typeof document === 'undefined') return;
    
    const link = document.createElement('a');
    link.download = `ai-generated-${image.id}.png`;
    link.href = image.url;
    link.click();
  };

  if (images.length === 0) {
    return (
      <div className={`text-center text-muted-foreground py-8 ${className}`}>
        <Palette size={48} className="mx-auto mb-4 opacity-50" />
        <p>No images generated yet</p>
        <p className="text-sm">Ask the agent to create or generate images!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group border border-border rounded-lg overflow-hidden bg-card"
          >
            <img
              src={image.url}
              alt={image.prompt}
              className="w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSelectedImage(image)}
            />
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedImage(image)}
                >
                  <Expand size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadImage(image)}
                >
                  <Download size={16} />
                </Button>
                {onRemoveImage && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemoveImage(image.id)}
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>

            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate">
                {image.prompt}
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {image.style}
                </span>
                <span className="text-xs text-muted-foreground">
                  {image.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Generated Image</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedImage.prompt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadImage(selectedImage)}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                  {onRemoveImage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        onRemoveImage(selectedImage.id);
                        setSelectedImage(null);
                      }}
                    >
                      <X size={16} className="mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden bg-white">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Style:</span>
                  <span className="ml-2 text-muted-foreground">{selectedImage.style}</span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-2 text-muted-foreground">
                    {selectedImage.timestamp.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
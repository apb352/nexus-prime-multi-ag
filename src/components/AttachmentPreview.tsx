import React from 'react';
import { FileAttachment } from '@/lib/types';
import { fileService } from '@/lib/file-service';
import { Button } from '@/components/ui/button';
import { X, Download, Eye } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface AttachmentPreviewProps {
  attachment: FileAttachment;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
  className?: string;
}

export function AttachmentPreview({ 
  attachment, 
  onRemove, 
  showRemove = true,
  className = "" 
}: AttachmentPreviewProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl || attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${attachment.name}`);
  };

  const handlePreview = () => {
    if (attachment.dataUrl || attachment.url) {
      window.open(attachment.dataUrl || attachment.url, '_blank');
    }
  };

  const renderPreview = () => {
    if (fileService.isImageFile(attachment.type)) {
      return (
        <img
          src={attachment.dataUrl || attachment.url}
          alt={attachment.name}
          className="w-full h-32 object-cover rounded-md"
        />
      );
    }

    if (fileService.isVideoFile(attachment.type)) {
      return (
        <video
          src={attachment.dataUrl || attachment.url}
          className="w-full h-32 object-cover rounded-md"
          controls
        />
      );
    }

    if (fileService.isAudioFile(attachment.type)) {
      return (
        <div className="w-full h-32 bg-muted rounded-md flex flex-col items-center justify-center">
          <div className="text-2xl mb-2">🎵</div>
          <audio
            src={attachment.dataUrl || attachment.url}
            controls
            className="w-full"
          />
        </div>
      );
    }

    // For other file types, show icon and info
    return (
      <div className="w-full h-32 bg-muted rounded-md flex flex-col items-center justify-center">
        <div className="text-3xl mb-2">
          {fileService.getFileIcon(attachment.type)}
        </div>
        <div className="text-sm text-muted-foreground text-center">
          {attachment.name}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative bg-card border rounded-lg p-3 ${className}`}>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(attachment.id)}
          className="absolute top-1 right-1 w-6 h-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      <div className="mb-2">
        {renderPreview()}
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium truncate" title={attachment.name}>
          {attachment.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {fileService.formatFileSize(attachment.size)}
        </div>
        
        <div className="flex gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreview}
            className="h-6 px-2 text-xs"
            title="Preview"
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 px-2 text-xs"
            title="Download"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AttachmentListProps {
  attachments: FileAttachment[];
  onRemove?: (id: string) => void;
  showRemove?: boolean;
  className?: string;
}

export function AttachmentList({ 
  attachments, 
  onRemove, 
  showRemove = true,
  className = "" 
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove}
          showRemove={showRemove}
        />
      ))}
    </div>
  );
}

interface InlineAttachmentProps {
  attachment: FileAttachment;
  className?: string;
}

export function InlineAttachment({ attachment, className = "" }: InlineAttachmentProps) {
  const handleClick = () => {
    if (attachment.dataUrl || attachment.url) {
      window.open(attachment.dataUrl || attachment.url, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs hover:bg-secondary/80 transition-colors ${className}`}
      title={`Open ${attachment.name}`}
    >
      <span>{fileService.getFileIcon(attachment.type)}</span>
      <span className="truncate max-w-20">{attachment.name}</span>
    </button>
  );
}
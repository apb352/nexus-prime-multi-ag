import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Image, FileText, Video, Music } from '@phosphor-icons/react';
import { FileAttachment } from '@/lib/types';
import { fileService } from '@/lib/file-service';
import { toast } from 'sonner';

interface FileUploadButtonProps {
  onFileSelect: (attachments: FileAttachment[]) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
}

export function FileUploadButton({ 
  onFileSelect, 
  multiple = true, 
  accept,
  className = "" 
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const attachments = await Promise.all(
        files.map(file => fileService.uploadFile(file))
      );
      
      onFileSelect(attachments);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`text-muted-foreground hover:text-foreground ${className}`}
        title="Attach files"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}

interface QuickFileButtonsProps {
  onFileSelect: (attachments: FileAttachment[]) => void;
  className?: string;
}

export function QuickFileButtons({ onFileSelect, className = "" }: QuickFileButtonsProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const attachments = await Promise.all(
        Array.from(files).map(file => fileService.uploadFile(file))
      );
      
      onFileSelect(attachments);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files');
    }
  };

  return (
    <div className={`flex gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => imageInputRef.current?.click()}
        className="text-muted-foreground hover:text-foreground"
        title="Upload images"
      >
        <Image className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => documentInputRef.current?.click()}
        className="text-muted-foreground hover:text-foreground"
        title="Upload documents"
      >
        <FileText className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => videoInputRef.current?.click()}
        className="text-muted-foreground hover:text-foreground"
        title="Upload videos"
      >
        <Video className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => audioInputRef.current?.click()}
        className="text-muted-foreground hover:text-foreground"
        title="Upload audio"
      >
        <Music className="w-4 h-4" />
      </Button>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
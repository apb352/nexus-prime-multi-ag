import { FileAttachment } from './types';

export class FileService {
  private static instance: FileService;
  private attachments: Map<string, FileAttachment> = new Map();

  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  async uploadFile(file: File): Promise<FileAttachment> {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create data URL for file content
    const dataUrl = await this.fileToDataUrl(file);
    
    const attachment: FileAttachment = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      url: dataUrl, // For now, we'll use data URLs
      dataUrl,
      uploadDate: Date.now()
    };

    this.attachments.set(id, attachment);
    return attachment;
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getAttachment(id: string): FileAttachment | undefined {
    return this.attachments.get(id);
  }

  removeAttachment(id: string): void {
    this.attachments.delete(id);
  }

  isImageFile(type: string): boolean {
    return type.startsWith('image/');
  }

  isVideoFile(type: string): boolean {
    return type.startsWith('video/');
  }

  isAudioFile(type: string): boolean {
    return type.startsWith('audio/');
  }

  isTextFile(type: string): boolean {
    return type.startsWith('text/') || 
           type === 'application/json' || 
           type === 'application/javascript' ||
           type === 'application/xml';
  }

  isPdfFile(type: string): boolean {
    return type === 'application/pdf';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type: string): string {
    if (this.isImageFile(type)) return '🖼️';
    if (this.isVideoFile(type)) return '🎥';
    if (this.isAudioFile(type)) return '🎵';
    if (this.isTextFile(type)) return '📄';
    if (this.isPdfFile(type)) return '📋';
    return '📎';
  }

  async extractTextFromFile(file: File): Promise<string> {
    if (this.isTextFile(file.type)) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
    return `[File: ${file.name}]`;
  }

  // Get a description of the file for AI context
  async getFileDescription(attachment: FileAttachment): Promise<string> {
    let description = `File "${attachment.name}" (${this.formatFileSize(attachment.size)})`;
    
    if (this.isImageFile(attachment.type)) {
      description += ' - Image file';
    } else if (this.isVideoFile(attachment.type)) {
      description += ' - Video file';
    } else if (this.isAudioFile(attachment.type)) {
      description += ' - Audio file';
    } else if (this.isTextFile(attachment.type)) {
      description += ' - Text file';
      // For text files, we could include content preview
      try {
        const response = await fetch(attachment.dataUrl!);
        const text = await response.text();
        if (text.length <= 1000) {
          description += `\n\nContent:\n${text}`;
        } else {
          description += `\n\nContent preview:\n${text.substring(0, 500)}...`;
        }
      } catch (error) {
        console.warn('Could not read text file content:', error);
      }
    }
    
    return description;
  }
}

export const fileService = FileService.getInstance();
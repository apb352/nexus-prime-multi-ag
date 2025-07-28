export interface ImageSettings {
  enabled: boolean;
  canvasEnabled: boolean;
  imageGenEnabled: boolean;
  maxCanvasSize: number;
  imageStyle: 'realistic' | 'artistic' | 'cartoon' | 'cyberpunk' | 'minimalist';
  quality: 'standard' | 'hd';
}

export const defaultImageSettings: ImageSettings = {
  enabled: false,
  canvasEnabled: true,
  imageGenEnabled: true,
  maxCanvasSize: 1024,
  imageStyle: 'realistic',
  quality: 'standard'
};

export class ImageService {
  private static instance: ImageService;
  
  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  async generateImage(prompt: string, settings: ImageSettings): Promise<string | null> {
    if (!settings.imageGenEnabled) {
      throw new Error('Image generation is disabled');
    }

    try {
      // Enhanced prompt with style
      const enhancedPrompt = this.enhancePrompt(prompt, settings);
      
      // Use DALL-E 3 via OpenAI API (through spark.llm with special formatting)
      const imagePrompt = spark.llmPrompt`Generate an image: ${enhancedPrompt}

Style: ${settings.imageStyle}
Quality: ${settings.quality}
Size: ${settings.maxCanvasSize}x${settings.maxCanvasSize}

Return only a data URL or image URL that can be used directly in an img tag.`;

      // Note: This is a placeholder for actual image generation
      // In a real implementation, you'd use DALL-E API or similar
      const response = await spark.llm(imagePrompt, 'gpt-4o');
      
      // For now, return a placeholder that indicates the image was "generated"
      return this.createPlaceholderImage(prompt, settings);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  private enhancePrompt(prompt: string, settings: ImageSettings): string {
    const styleModifiers = {
      realistic: 'photorealistic, high detail, professional photography',
      artistic: 'artistic, painterly, creative composition',
      cartoon: 'cartoon style, animated, colorful',
      cyberpunk: 'cyberpunk aesthetic, neon colors, futuristic',
      minimalist: 'minimalist design, clean lines, simple composition'
    };

    const qualityModifiers = {
      standard: '4k resolution',
      hd: '8k resolution, ultra high definition'
    };

    return `${prompt}, ${styleModifiers[settings.imageStyle]}, ${qualityModifiers[settings.quality]}`;
  }

  private createPlaceholderImage(prompt: string, settings: ImageSettings): string {
    // Create a canvas with the generated image placeholder
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas not supported');

    canvas.width = Math.min(settings.maxCanvasSize, 512);
    canvas.height = Math.min(settings.maxCanvasSize, 512);

    // Create a gradient background based on style
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    switch (settings.imageStyle) {
      case 'cyberpunk':
        gradient.addColorStop(0, '#0f0f23');
        gradient.addColorStop(0.5, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        break;
      case 'minimalist':
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
        break;
      case 'artistic':
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.5, '#f59e0b');
        gradient.addColorStop(1, '#d97706');
        break;
      case 'cartoon':
        gradient.addColorStop(0, '#fecaca');
        gradient.addColorStop(0.5, '#fca5a5');
        gradient.addColorStop(1, '#f87171');
        break;
      default:
        gradient.addColorStop(0, '#374151');
        gradient.addColorStop(1, '#1f2937');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text
    ctx.fillStyle = settings.imageStyle === 'minimalist' ? '#1f2937' : '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text
    const words = prompt.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 40 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 30;
    const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    // Add "AI Generated" watermark
    ctx.font = '12px Arial';
    ctx.fillStyle = settings.imageStyle === 'minimalist' ? '#6b7280' : '#9ca3af';
    ctx.fillText('AI Generated Image', canvas.width / 2, canvas.height - 20);

    return canvas.toDataURL('image/png');
  }

  createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  exportCanvasAsImage(canvas: HTMLCanvasElement, format: 'png' | 'jpg' = 'png'): string {
    return canvas.toDataURL(`image/${format}`);
  }

  resizeImage(imageUrl: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw resized image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
}
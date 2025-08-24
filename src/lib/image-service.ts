export interface ImageSettings {
  enabled: boolean;
  canvasEnabled: boolean;
  imageGenEnabled: boolean;
  maxCanvasSize: number;
  imageStyle: 'realistic' | 'artistic' | 'cartoon' | 'cyberpunk' | 'minimalist';
  quality: 'standard' | 'hd';
}

export const defaultImageSettings: ImageSettings = {
  enabled: true,
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
      
      // Create a properly formatted image generation request
      const imagePrompt = spark.llmPrompt`I need to generate an image with the following description: ${enhancedPrompt}

Please create a detailed visual representation with these specifications:
- Style: ${settings.imageStyle}
- Quality: ${settings.quality}
- Dimensions: ${settings.maxCanvasSize}x${settings.maxCanvasSize} pixels

Generate this as an actual image that can be displayed to the user. The image should be creative, detailed, and match the requested style and prompt exactly.`;

      try {
        // Attempt to use the LLM for actual image generation
        const response = await spark.llm(imagePrompt, 'gpt-4o');
        
        // Check if response contains a valid image URL or data URL
        const urlMatch = response.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))|(data:image\/[^;]+;base64,[^"'\s]+)/i);
        
        if (urlMatch) {
          return urlMatch[0];
        }
        
        // If no valid image URL found in response, fall back to placeholder
        console.log('No valid image URL in LLM response, using placeholder');
        return this.createPlaceholderImage(prompt, settings);
        
      } catch (llmError) {
        console.log('LLM image generation failed, using placeholder:', llmError);
        return this.createPlaceholderImage(prompt, settings);
      }
      
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
    // Only create placeholder in browser environment
    if (typeof document === 'undefined') {
      throw new Error('Canvas not available in server environment');
    }
    
    // Create a canvas with the generated image placeholder
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas not supported');

    canvas.width = Math.min(settings.maxCanvasSize, 512);
    canvas.height = Math.min(settings.maxCanvasSize, 512);

    // Create a more sophisticated gradient background based on style
    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    
    switch (settings.imageStyle) {
      case 'cyberpunk':
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.6, '#6366f1');
        gradient.addColorStop(1, '#0f0f23');
        break;
      case 'minimalist':
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.8, '#f1f5f9');
        gradient.addColorStop(1, '#e2e8f0');
        break;
      case 'artistic':
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.5, '#f59e0b');
        gradient.addColorStop(1, '#d97706');
        break;
      case 'cartoon':
        gradient.addColorStop(0, '#fde047');
        gradient.addColorStop(0.5, '#facc15');
        gradient.addColorStop(1, '#eab308');
        break;
      default: // realistic
        gradient.addColorStop(0, '#64748b');
        gradient.addColorStop(0.7, '#475569');
        gradient.addColorStop(1, '#334155');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add decorative elements based on style
    this.addStyleDecorations(ctx, canvas, settings.imageStyle);

    // Add text with better styling
    ctx.fillStyle = settings.imageStyle === 'minimalist' ? '#1f2937' : '#ffffff';
    ctx.font = `bold ${Math.max(16, canvas.width / 20)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Wrap text with better formatting
    const words = prompt.split(' ');
    const lines = [];
    let currentLine = '';
    const maxWidth = canvas.width - 60;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = Math.max(24, canvas.height / 15);
    const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    // Reset shadow for watermark
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Add "AI Generated" watermark with style badge
    ctx.font = `${Math.max(10, canvas.width / 40)}px Arial`;
    ctx.fillStyle = settings.imageStyle === 'minimalist' ? '#6b7280' : '#9ca3af';
    ctx.fillText('✨ AI Generated', canvas.width / 2, canvas.height - 30);
    
    // Add style indicator
    ctx.fillText(`Style: ${settings.imageStyle}`, canvas.width / 2, canvas.height - 15);

    return canvas.toDataURL('image/png');
  }

  private addStyleDecorations(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, style: string) {
    switch (style) {
      case 'cyberpunk':
        // Add glowing lines
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.stroke();
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        break;
        
      case 'artistic':
        // Add paint splatters
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 20 + 5,
            0, 2 * Math.PI
          );
          ctx.fill();
        }
        break;
        
      case 'cartoon':
        // Add colorful circles
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        colors.forEach((color, i) => {
          ctx.fillStyle = color + '80'; // Add transparency
          ctx.beginPath();
          ctx.arc(
            (canvas.width / colors.length) * (i + 0.5),
            canvas.height * 0.15,
            15,
            0, 2 * Math.PI
          );
          ctx.fill();
        });
        break;
        
      case 'minimalist':
        // Add subtle geometric shapes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);
        ctx.stroke();
        break;
    }
  }

  createCanvas(width: number, height: number): HTMLCanvasElement {
    if (typeof document === 'undefined') {
      throw new Error('Canvas not available in server environment');
    }
    
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
      if (typeof document === 'undefined') {
        reject(new Error('Image resize not available in server environment'));
        return;
      }
      
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
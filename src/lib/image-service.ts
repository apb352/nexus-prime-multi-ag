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
      console.log('Generating artistic representation for:', prompt);
      
      // Create an enhanced artistic representation using canvas
      return this.createArtisticImage(prompt, settings);
      
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

  private createArtisticImage(prompt: string, settings: ImageSettings): string {
    // Only create images in browser environment
    if (typeof document === 'undefined') {
      throw new Error('Canvas not available in server environment');
    }
    
    // Create a canvas with the generated image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas not supported');

    // Adjust canvas size based on quality setting
    const qualityMultiplier = settings.quality === 'hd' ? 1.5 : 1;
    const baseSize = Math.min(settings.maxCanvasSize, 512);
    
    canvas.width = Math.floor(baseSize * qualityMultiplier);
    canvas.height = Math.floor(baseSize * qualityMultiplier);

    // Generate art based on prompt content and style
    this.generatePromptBasedArt(ctx, canvas, prompt, settings);

    // For HD quality, apply additional processing
    if (settings.quality === 'hd') {
      this.enhanceCanvasForHD(ctx, canvas);
    }

    return canvas.toDataURL('image/png');
  }

  private enhanceCanvasForHD(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Apply post-processing effects for HD quality
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Enhance contrast and saturation for HD effect
    for (let i = 0; i < data.length; i += 4) {
      // Enhance contrast
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.1 + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.1 + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.1 + 128)); // Blue
      
      // Slightly increase saturation
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = Math.min(255, Math.max(0, data[i] + (data[i] - avg) * 0.2));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (data[i + 1] - avg) * 0.2));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (data[i + 2] - avg) * 0.2));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add subtle sharpening overlay
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private generatePromptBasedArt(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, prompt: string, settings: ImageSettings) {
    const promptLower = prompt.toLowerCase();
    
    // Analyze prompt for key visual elements
    const isNature = /nature|tree|forest|flower|mountain|ocean|sea|lake|sky|cloud|sunset|sunrise|landscape/.test(promptLower);
    const isAnimal = /cat|dog|bird|fish|animal|lion|elephant|horse|rabbit/.test(promptLower);
    const isAbstract = /abstract|geometric|pattern|design|art|creative/.test(promptLower);
    const isSpace = /space|star|galaxy|planet|universe|cosmic|nebula/.test(promptLower);
    const isCity = /city|building|urban|street|architecture|skyline/.test(promptLower);
    const isSunset = /sunset|sunrise|golden hour|dusk|dawn/.test(promptLower);
    const isOcean = /ocean|sea|water|wave|beach|coast/.test(promptLower);
    
    // Create sophisticated background based on theme
    if (isSunset) {
      this.createSunsetBackground(ctx, canvas);
    } else if (isOcean) {
      this.createOceanBackground(ctx, canvas);
    } else if (isSpace) {
      this.createSpaceBackground(ctx, canvas);
    } else if (isNature) {
      this.createNatureBackground(ctx, canvas);
    } else if (isCity) {
      this.createCityBackground(ctx, canvas);
    } else {
      this.createAbstractBackground(ctx, canvas, settings);
    }

    // Add style-specific elements
    this.addStyleSpecificElements(ctx, canvas, settings.imageStyle, promptLower);

    // Add a subtle title/description
    this.addArtisticTitle(ctx, canvas, prompt, settings);
  }

  private createSunsetBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Create sunset gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFD700'); // Golden yellow top
    gradient.addColorStop(0.3, '#FF8C00'); // Orange
    gradient.addColorStop(0.6, '#FF4500'); // Red orange
    gradient.addColorStop(0.8, '#8B0000'); // Dark red
    gradient.addColorStop(1, '#2F1B69'); // Deep purple bottom
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add sun circle
    const sunX = canvas.width * 0.7;
    const sunY = canvas.height * 0.3;
    const sunRadius = canvas.width * 0.08;
    
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
    sunGradient.addColorStop(0, '#FFFF00');
    sunGradient.addColorStop(0.7, '#FFA500');
    sunGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
    
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, 2 * Math.PI);
    ctx.fill();

    // Add silhouette elements
    this.addSilhouettes(ctx, canvas);
  }

  private createOceanBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Ocean gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.6, '#4682B4'); // Steel blue
    gradient.addColorStop(1, '#191970'); // Midnight blue

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add waves
    this.addWaves(ctx, canvas);
    
    // Add foam effects
    this.addFoamEffects(ctx, canvas);
  }

  private createSpaceBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Deep space background
    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add stars
    this.addStars(ctx, canvas);
    
    // Add nebula effects
    this.addNebulaEffects(ctx, canvas);
  }

  private createNatureBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Nature gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky
    gradient.addColorStop(0.4, '#98FB98'); // Light green
    gradient.addColorStop(1, '#228B22'); // Forest green

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add trees and natural elements
    this.addTrees(ctx, canvas);
  }

  private createCityBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // City gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4169E1'); // Royal blue sky
    gradient.addColorStop(0.6, '#696969'); // Dim gray
    gradient.addColorStop(1, '#2F4F4F'); // Dark slate gray

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add building silhouettes
    this.addBuildings(ctx, canvas);
  }

  private createAbstractBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: ImageSettings) {
    // Create abstract art based on style
    switch (settings.imageStyle) {
      case 'cyberpunk':
        this.createCyberpunkAbstract(ctx, canvas);
        break;
      case 'minimalist':
        this.createMinimalistAbstract(ctx, canvas);
        break;
      case 'artistic':
        this.createArtisticAbstract(ctx, canvas);
        break;
      default:
        this.createGenericAbstract(ctx, canvas);
    }
  }

  private addSilhouettes(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    
    // Add mountain silhouettes
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.7);
    ctx.lineTo(canvas.width * 0.3, canvas.height * 0.5);
    ctx.lineTo(canvas.width * 0.6, canvas.height * 0.6);
    ctx.lineTo(canvas.width, canvas.height * 0.4);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  private addWaves(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const waveHeight = canvas.height * 0.1;
    const waveY = canvas.height * 0.8;
    
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 - i * 0.1})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      for (let x = 0; x <= canvas.width; x += 10) {
        const y = waveY + Math.sin((x / 50) + (i * Math.PI / 3)) * waveHeight;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  private addFoamEffects(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = canvas.height * 0.8 + Math.random() * canvas.height * 0.2;
      const radius = Math.random() * 8 + 2;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private addStars(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private addNebulaEffects(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 100 + 50;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, colors[i] + '40');
      gradient.addColorStop(1, colors[i] + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private addTrees(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.fillStyle = 'rgba(34, 139, 34, 0.8)';
    
    for (let i = 0; i < 8; i++) {
      const x = (canvas.width / 8) * i + Math.random() * 30;
      const treeHeight = canvas.height * 0.3 + Math.random() * canvas.height * 0.2;
      const treeWidth = 20 + Math.random() * 20;
      
      // Tree trunk
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - 5, canvas.height - treeHeight * 0.3, 10, treeHeight * 0.3);
      
      // Tree foliage
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(x, canvas.height - treeHeight, treeWidth, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private addBuildings(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    
    for (let i = 0; i < 10; i++) {
      const x = (canvas.width / 10) * i;
      const buildingHeight = canvas.height * 0.3 + Math.random() * canvas.height * 0.4;
      const buildingWidth = canvas.width / 10;
      
      ctx.fillRect(x, canvas.height - buildingHeight, buildingWidth - 2, buildingHeight);
      
      // Add windows
      ctx.fillStyle = '#FFD700';
      for (let w = 0; w < 3; w++) {
        for (let h = 0; h < Math.floor(buildingHeight / 20); h++) {
          if (Math.random() > 0.3) {
            ctx.fillRect(
              x + 5 + w * 8,
              canvas.height - buildingHeight + h * 20 + 5,
              4, 6
            );
          }
        }
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    }
  }

  private createCyberpunkAbstract(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Cyberpunk gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#06b6d4');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add neon grid
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }

  private createMinimalistAbstract(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add minimal geometric shapes
    const colors = ['#e5e7eb', '#d1d5db', '#9ca3af'];
    
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i];
      const size = 80 + i * 40;
      const x = canvas.width / 2 - size / 2;
      const y = canvas.height / 2 - size / 2 + i * 20;
      
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private createArtisticAbstract(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Warm artistic gradient
    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(0.5, '#f59e0b');
    gradient.addColorStop(1, '#d97706');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add artistic brush strokes
    const colors = ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.1)'];
    
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = Math.random() * 20 + 5;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  }

  private createGenericAbstract(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Generic colorful abstract
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
    
    for (let i = 0; i < colors.length; i++) {
      const radius = (canvas.width / colors.length) * (i + 1);
      const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, radius
      );
      gradient.addColorStop(0, colors[i] + '40');
      gradient.addColorStop(1, colors[i] + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private addStyleSpecificElements(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, style: string, prompt: string) {
    switch (style) {
      case 'cyberpunk':
        this.addCyberpunkElements(ctx, canvas);
        break;
      case 'cartoon':
        this.addCartoonElements(ctx, canvas);
        break;
      case 'artistic':
        this.addArtisticElements(ctx, canvas);
        break;
      case 'realistic':
        this.addRealisticElements(ctx, canvas);
        break;
      case 'minimalist':
        this.addMinimalistElements(ctx, canvas);
        break;
    }
  }

  private addCyberpunkElements(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Add glowing lines and circuit patterns
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  private addCartoonElements(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Add colorful cartoon-style shapes
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
    
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 30 + 10;
      
      if (i % 3 === 0) {
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
      } else if (i % 3 === 1) {
        // Square
        ctx.fillRect(x - size/2, y - size/2, size, size);
      } else {
        // Triangle
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private addRealisticElements(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Add subtle textures and realistic lighting effects
    ctx.globalAlpha = 0.15;
    
    // Add texture overlay
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1 + 0.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Add soft lighting effects
    const lightGradient = ctx.createRadialGradient(
      canvas.width * 0.3, canvas.height * 0.3, 0,
      canvas.width * 0.3, canvas.height * 0.3, canvas.width * 0.7
    );
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalAlpha = 1;
  }

  private addMinimalistElements(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Add clean, geometric elements for minimalist style
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    
    // Add subtle grid lines
    const gridSize = canvas.width / 8;
    for (let x = gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Add single accent shape
    ctx.fillStyle = '#9ca3af';
    ctx.globalAlpha = 0.2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, canvas.width / 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalAlpha = 1;
  }

  private addArtisticElements(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Add artistic paint splatters and brush effects
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = `hsla(${Math.random() * 360}, 70%, 60%, 0.4)`;
      
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 40 + 10;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add smaller dots around main splatter
      for (let j = 0; j < 5; j++) {
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 60;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, Math.random() * 8 + 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  private addArtisticTitle(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, prompt: string, settings: ImageSettings) {
    // Add a stylized title/watermark
    ctx.font = `bold ${Math.max(14, canvas.width / 25)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Add shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Choose text color based on style
    if (settings.imageStyle === 'minimalist') {
      ctx.fillStyle = '#374151';
    } else if (settings.imageStyle === 'cyberpunk') {
      ctx.fillStyle = '#00ff88';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    
    // Truncate prompt for display
    const displayPrompt = prompt.length > 30 ? prompt.substring(0, 27) + '...' : prompt;
    ctx.fillText(`"${displayPrompt}"`, canvas.width / 2, canvas.height - 40);
    
    // Add generation info
    ctx.font = `${Math.max(10, canvas.width / 40)}px Arial`;
    ctx.fillStyle = settings.imageStyle === 'minimalist' ? '#6b7280' : '#cbd5e1';
    ctx.fillText(`✨ AI Generated • ${settings.imageStyle} style`, canvas.width / 2, canvas.height - 20);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
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
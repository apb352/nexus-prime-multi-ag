import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageService, ImageSettings } from '@/lib/image-service';

export function ImageGenerationTest() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState<'realistic' | 'artistic' | 'cartoon' | 'cyberpunk' | 'minimalist'>('realistic');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');

  const testGeneration = async () => {
    setIsGenerating(true);
    try {
      const imageService = ImageService.getInstance();
      const testSettings: ImageSettings = {
        enabled: true,
        canvasEnabled: true,
        imageGenEnabled: true,
        maxCanvasSize: 512,
        imageStyle: style,
        quality: quality
      };

      console.log('Testing with settings:', testSettings);
      const imageUrl = await imageService.generateImage('A beautiful sunset over mountains', testSettings);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Test generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Image Generation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Style:</label>
          <Select value={style} onValueChange={(value: any) => setStyle(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realistic">Realistic</SelectItem>
              <SelectItem value="artistic">Artistic</SelectItem>
              <SelectItem value="cartoon">Cartoon</SelectItem>
              <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
              <SelectItem value="minimalist">Minimalist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Quality:</label>
          <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="hd">HD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={testGeneration} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Test Generate'}
        </Button>

        {generatedImage && (
          <div className="mt-4">
            <div className="relative">
              <img 
                src={generatedImage} 
                alt="Generated test image" 
                className="w-full border rounded"
              />
              <div className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {style} • {quality}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p><strong>Style:</strong> {style}</p>
              <p><strong>Quality:</strong> {quality}</p>
              <p><strong>Prompt:</strong> "A beautiful sunset over mountains"</p>
              <p className="text-accent">✨ Generated using canvas-based artistic rendering</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
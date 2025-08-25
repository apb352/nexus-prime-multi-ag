import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageService, ImageSettings } from '@/lib/image-service';
import { TestTube2, Download, Wand2 } from '@phosphor-icons/react';
import { toast } from 'sonner';

export function ImageGenerationTest() {
  const [prompt, setPrompt] = useState('A beautiful sunset over mountains');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState<'realistic' | 'artistic' | 'cartoon' | 'cyberpunk' | 'minimalist'>('realistic');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [generationType, setGenerationType] = useState<'ai' | 'canvas' | 'unknown'>('unknown');

  const testGeneration = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    setGenerationType('unknown');
    
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

      console.log('Testing image generation with settings:', testSettings);
      console.log('Prompt:', prompt);
      
      const imageUrl = await imageService.generateImage(prompt, testSettings);
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        // Determine if this is AI or canvas generated
        if (imageUrl.startsWith('http') || imageUrl.includes('ai-generated')) {
          setGenerationType('ai');
          toast.success('AI image generated!');
        } else {
          setGenerationType('canvas');
          toast.success('Canvas art created!');
        }
      } else {
        toast.error('No image generated');
      }
    } catch (error) {
      console.error('Test generation failed:', error);
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `test-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded!');
    }
  };

  const quickPrompts = [
    'A beautiful sunset over mountains',
    'A mystical forest with glowing fireflies',
    'A cyberpunk city with neon lights',
    'An abstract geometric composition',
    'A peaceful beach at golden hour'
  ];

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube2 size={20} />
          Image Generation Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-prompt">Prompt</Label>
          <Input
            id="test-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image..."
          />
        </div>

        <div className="space-y-2">
          <Label>Quick Prompts</Label>
          <div className="flex flex-wrap gap-1">
            {quickPrompts.map((quickPrompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setPrompt(quickPrompt)}
                className="text-xs h-8"
              >
                {quickPrompt.split(' ').slice(0, 2).join(' ')}...
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <Label>Style</Label>
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
          <Label>Quality</Label>
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
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={16} className="mr-2" />
              Test Generate
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="mt-4">
            <div className="relative">
              <img 
                src={generatedImage} 
                alt="Generated test image" 
                className="w-full border rounded"
              />
              <div className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                {generationType === 'ai' && <span className="text-green-400">AI</span>}
                {generationType === 'canvas' && <span className="text-blue-400">Canvas</span>}
                {style} • {quality}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="absolute bottom-2 right-2 opacity-75 hover:opacity-100"
              >
                <Download size={14} />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p><strong>Prompt:</strong> "{prompt}"</p>
              <p><strong>Style:</strong> {style} • <strong>Quality:</strong> {quality}</p>
              <p className="text-accent">
                {generationType === 'ai' ? '✨ Generated using AI model' : '🎨 Generated using canvas-based artistic rendering'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
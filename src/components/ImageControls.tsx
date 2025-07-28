import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ImageIcon, Palette, Download, Settings } from '@phosphor-icons/react';
import { ImageSettings, ImageService } from '@/lib/image-service';

interface ImageControlsProps {
  settings: ImageSettings;
  onSettingsChange: (settings: ImageSettings) => void;
  onGenerateImage: (prompt: string) => void;
  isGenerating?: boolean;
}

export function ImageControls({ 
  settings, 
  onSettingsChange, 
  onGenerateImage,
  isGenerating = false 
}: ImageControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (key: keyof ImageSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleQuickGenerate = () => {
    if (settings.enabled) {
      const prompts = [
        'A futuristic cityscape at night',
        'Abstract digital art with flowing colors',
        'A cyberpunk character portrait',
        'Minimalist geometric patterns',
        'A magical forest scene'
      ];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      onGenerateImage(randomPrompt);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`image-controls-popover relative ${
            settings.enabled 
              ? 'text-accent hover:text-accent-foreground hover:bg-accent/20' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ImageIcon size={16} />
          {settings.enabled && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 image-controls-popover" 
        side="top"
        sideOffset={5}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Palette size={16} />
              Image Generation
            </h4>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canvas-enabled"
                    checked={settings.canvasEnabled}
                    onCheckedChange={(checked) => handleSettingChange('canvasEnabled', checked)}
                  />
                  <Label htmlFor="canvas-enabled" className="text-sm">
                    Canvas Drawing
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="image-gen-enabled"
                    checked={settings.imageGenEnabled}
                    onCheckedChange={(checked) => handleSettingChange('imageGenEnabled', checked)}
                  />
                  <Label htmlFor="image-gen-enabled" className="text-sm">
                    AI Image Generation
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Style</Label>
                <Select
                  value={settings.imageStyle}
                  onValueChange={(value) => handleSettingChange('imageStyle', value)}
                >
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

              <div className="space-y-2">
                <Label className="text-sm font-medium">Quality</Label>
                <Select
                  value={settings.quality}
                  onValueChange={(value) => handleSettingChange('quality', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="hd">HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Canvas Size: {settings.maxCanvasSize}px
                </Label>
                <Slider
                  value={[settings.maxCanvasSize]}
                  onValueChange={([value]) => handleSettingChange('maxCanvasSize', value)}
                  min={256}
                  max={1024}
                  step={64}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleQuickGenerate}
                  disabled={isGenerating || !settings.imageGenEnabled}
                  className="flex-1"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon size={14} className="mr-2" />
                      Quick Generate
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-2">
                Agents can create images and use canvas for drawing when enabled
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, DiscordLogo, Settings } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/use-theme';
import { DiscordBotManager } from './DiscordBotManager';
import { Theme } from '@/lib/types';

const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'Neon blues and electric energy' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean whites and subtle grays' },
  { value: 'cozy', label: 'Cozy', description: 'Warm browns and comfortable tones' }
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {/* Discord Settings */}
      <Popover open={showSettings} onOpenChange={setShowSettings}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-card/80 backdrop-blur-sm border-border"
          >
            <DiscordLogo size={16} className="mr-2" />
            Discord
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[500px] p-0 z-[2500]" 
          side="bottom"
          align="end"
        >
          <DiscordBotManager />
        </PopoverContent>
      </Popover>
      
      {/* Theme Selector */}
      <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
        <SelectTrigger className="w-40 bg-card/80 backdrop-blur-sm border-border">
          <div className="flex items-center space-x-2">
            <Palette size={16} />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {THEMES.map((themeOption) => (
            <SelectItem key={themeOption.value} value={themeOption.value}>
              <div>
                <div className="font-medium">{themeOption.label}</div>
                <div className="text-xs text-muted-foreground">{themeOption.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
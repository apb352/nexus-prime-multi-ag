import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/use-theme';
import { GlobalDiscordSettings } from './GlobalDiscordSettings';
import { Theme } from '@/lib/types';

const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'Neon blues and electric energy' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean whites and subtle grays' },
  { value: 'cozy', label: 'Cozy', description: 'Warm browns and comfortable tones' }
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <GlobalDiscordSettings />
      
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
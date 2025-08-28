import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, DiscordLogo, StopCircle, AlertTriangle, Bug } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/use-theme';
import { DiscordBotManager } from './DiscordBotManager';
import { DiscordStatus } from './DiscordStatus';
import { Theme } from '@/lib/types';

const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'Neon blues and electric energy' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean whites and subtle grays' },
  { value: 'cozy', label: 'Cozy', description: 'Warm browns and comfortable tones' }
];

interface TopNavigationProps {
  onStopAll: () => void;
  onStopWindow: (windowId: string) => void;
  activeWindows: Array<{ id: string; agentName?: string; isGroupChat?: boolean; groupTopic?: string }>;
  showDebug?: boolean;
  onToggleDebug?: () => void;
}

export function TopNavigation({ 
  onStopAll, 
  onStopWindow, 
  activeWindows, 
  showDebug = false, 
  onToggleDebug 
}: TopNavigationProps) {
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);

  const handleStopAll = () => {
    onStopAll();
    setShowEmergencyDialog(false);
  };

  const hasActiveWindows = activeWindows.length > 0;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-from-top">
      {/* Main Navigation Container */}
      <div className="flex items-center gap-3 glass-nav rounded-xl p-2 shadow-2xl">
        
        {/* Discord Status Indicator */}
        <DiscordStatus showLabel={false} />
        
        {/* Theme Selector */}
        <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
          <SelectTrigger className="w-36 h-8 nav-button bg-background/50 border-border/30 hover:bg-background/70" title="Change visual theme">
            <div className="flex items-center space-x-2">
              <Palette size={14} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="z-[2600]">
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

        {/* Discord Settings */}
        <Popover open={showSettings} onOpenChange={setShowSettings}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 nav-button bg-background/50 border-border/30 hover:bg-background/70"
              title="Discord bot configuration and setup"
            >
              <DiscordLogo size={14} className="mr-1" />
              Discord
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[500px] p-0 z-[2600]" 
            side="bottom"
            align="end"
          >
            <DiscordBotManager />
          </PopoverContent>
        </Popover>

        {/* Emergency Stop */}
        <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 nav-button bg-red-600/90 hover:bg-red-700 border-red-500/30 shadow-lg animate-button-press"
              disabled={!hasActiveWindows}
              title="Emergency stop all AI operations"
            >
              <StopCircle size={14} className="mr-1" />
              Stop
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md z-[2600]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-destructive" />
                Emergency Stop Controls
              </DialogTitle>
              <DialogDescription>
                Stop all AI operations immediately if something goes wrong.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle size={16} />
                <AlertDescription>
                  Use these controls if AI agents are stuck in loops or behaving unexpectedly.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  onClick={handleStopAll}
                  className="w-full"
                  disabled={!hasActiveWindows}
                >
                  <StopCircle size={16} className="mr-2" />
                  Stop All AI Operations
                </Button>
                
                {activeWindows.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <h4 className="text-sm font-medium">Stop Individual Windows:</h4>
                    {activeWindows.map((window) => (
                      <Button
                        key={window.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onStopWindow(window.id);
                          setShowEmergencyDialog(false);
                        }}
                        className="w-full justify-start text-left"
                      >
                        <StopCircle size={14} className="mr-2" />
                        {window.isGroupChat 
                          ? `Group: ${window.groupTopic}`
                          : window.agentName
                        }
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Debug Toggle (Development Only) */}
        {import.meta.env.DEV && onToggleDebug && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDebug}
            className="h-8 nav-button bg-background/50 border-border/30 hover:bg-background/70"
            title="Toggle debug panel"
          >
            <Bug size={14} className="mr-1" />
            {showDebug ? 'Hide' : 'Debug'}
          </Button>
        )}
      </div>
    </div>
  );
}
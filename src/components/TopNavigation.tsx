import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, DiscordLogo, StopCircle, AlertTriangle, Bug } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/use-theme';
import { DiscordStatus } from './DiscordStatus';
import { DiscordBotManager } from './DiscordBotManager';
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
  showDebug,
  onToggleDebug
}: TopNavigationProps) {
  const { theme, setTheme } = useTheme();
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasActiveWindows = activeWindows.length > 0;

  const handleStopAll = () => {
    onStopAll();
    setShowEmergencyDialog(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[2000] glass-nav border-b border-border/30">
      <div className="flex items-center justify-between p-4">
        {/* Left side - Brand */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Nexus Prime
          </h1>
          <DiscordStatus />
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-3">
          {/* Theme Selector */}
          <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            <SelectTrigger className="w-[140px] h-8 bg-background/50 border-border/30 hover:bg-background/70 transition-colors">
              <Palette size={14} className="mr-1" />
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent className="z-[2500]">
              {THEMES.map((themeOption) => (
                <SelectItem key={themeOption.value} value={themeOption.value}>
                  <div className="flex flex-col">
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
                className="h-8 nav-button bg-background/50 border-border/30 hover:bg-background/70 transition-colors"
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
                className="h-8 nav-button bg-red-600/90 hover:bg-red-700 border-red-500/30 transition-all duration-200 shadow-lg"
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
                          : `Agent: ${window.agentName || 'Unknown'}`
                        }
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Debug Toggle (Development Only) */}
          {import.meta.env.DEV && onToggleDebug && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDebug}
              className="h-8 nav-button bg-background/50 border-border/30 hover:bg-background/70 transition-colors"
              title="Toggle debug panel"
            >
              <Bug size={14} className="mr-1" />
              {showDebug ? 'Hide' : 'Debug'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
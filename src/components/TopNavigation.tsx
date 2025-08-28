import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, DiscordLogo, StopCircle, AlertTriangle, Bug } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/use-theme';

type Theme = 'cyberpunk' | 'minimalist' | 'cozy';

interface TopNavigationProps {
  onStopAll: () => void;
  onStopWindow: (windowId: string) => void;
  activeWindows: Array<{
    id: string;
    agentName: string;
    isGroupChat?: boolean;
    groupTopic?: string;
  }>;
  showDebug: boolean;
  onToggleDebug?: () => void;
}

// Discord Status Component
function DiscordStatus() {
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <DiscordLogo size={16} />
      <span>Discord Ready</span>
    </div>
  );
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
              <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
              <SelectItem value="minimalist">Minimalist</SelectItem>
              <SelectItem value="cozy">Cozy</SelectItem>
            </SelectContent>
          </Select>

          {/* Emergency Stop */}
          <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 nav-button"
                title="Emergency stop all AI operations"
              >
                <StopCircle size={14} className="mr-1" />
                Emergency Stop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertTriangle size={20} className="text-destructive" />
                  <span>Emergency Stop</span>
                </DialogTitle>
                <DialogDescription>
                  This will immediately stop all AI operations and close all chat windows.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle size={16} />
                  <AlertDescription>
                    All active conversations will be stopped and windows will be closed.
                    This action cannot be undone.
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
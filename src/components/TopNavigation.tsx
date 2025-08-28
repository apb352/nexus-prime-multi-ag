import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, DiscordLogo, StopCircle, AlertTriangle, Bug } from '@phosphor-icons/react';
import { useTheme } from '@/hooks/use-theme';
const THEMES: { value: Theme; label: string; description
import { DiscordStatus } from './DiscordStatus';
  { value: 'cozy', label: 'Cozy', de

interface TopNavigationProps {
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'Neon blues and electric energy' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean whites and subtle grays' },
  { value: 'cozy', label: 'Cozy', description: 'Warm browns and comfortable tones' }
}

  onStopAll, 
  onStopAll: () => void;
  onStopWindow: (windowId: string) => void;
  activeWindows: Array<{ id: string; agentName?: string; isGroupChat?: boolean; groupTopic?: string }>;
  showDebug?: boolean;
  onToggleDebug?: () => void;


    setShowEmergencyDialog(false
  onStopAll, 
  const hasActiv
  activeWindows, 
    <div className="f
  onToggleDebug 
                  <div c
                </div>
            ))}
        </Select>

          <PopoverTrigger asChi
              va
              className="h-8 nav-b
    

          </PopoverTrigger>

          
            <DiscordBotManager />
        </Popover>
        {/* Emergency Stop */}
        
              variant="destructive"
              className="h-8 nav-button bg-
        
              <StopCircle size
            </Button>
          
            <DialogHeader>
                <AlertTriangle size
              </DialogTitle>
                St
            </DialogHeader
            <div className="space-y-4">
                <AlertTriangle size={16} /
                  Use these controls if AI agents are stuck in loops or beha
              </Alert
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
              className="h-8 bg-background/50 border-border/30 hover:bg-background/70 transition-colors"
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
              className="h-8 bg-red-600/90 hover:bg-red-700 border-red-500/30 transition-all duration-200 shadow-lg"
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

                  onClick={handleStopAll}
                  className="w-full"
                  disabled={!hasActiveWindows}

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

                        onClick={() => {
                          onStopWindow(window.id);
                          setShowEmergencyDialog(false);
                        }}
                        className="w-full justify-start text-left"

                        <StopCircle size={14} className="mr-2" />
                        {window.isGroupChat 
                          ? `Group: ${window.groupTopic}`

                        }

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

            className="h-8 bg-background/50 border-border/30 hover:bg-background/70 transition-colors"
            title="Toggle debug panel"
          >
            <Bug size={14} className="mr-1" />
            {showDebug ? 'Hide' : 'Debug'}
          </Button>
        )}

    </div>

}
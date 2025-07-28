import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StopCircle, AlertTriangle } from '@phosphor-icons/react';

interface EmergencyStopProps {
  onStopAll: () => void;
  onStopWindow: (windowId: string) => void;
  activeWindows: Array<{ id: string; agentName?: string; isGroupChat?: boolean; groupTopic?: string }>;
}

export function EmergencyStop({ onStopAll, onStopWindow, activeWindows }: EmergencyStopProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleStopAll = () => {
    onStopAll();
    setShowDialog(false);
  };

  const hasActiveWindows = activeWindows.length > 0;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="fixed top-28 right-4 z-[10001] shadow-lg bg-red-600 hover:bg-red-700"
          disabled={!hasActiveWindows}
        >
          <StopCircle size={16} className="mr-1" />
          Emergency Stop
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
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
                      setShowDialog(false);
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
  );
}
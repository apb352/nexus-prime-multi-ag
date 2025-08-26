import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export function VoiceSettingsDebug() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [`${timestamp}: ${info}`, ...prev.slice(0, 4)]);
  };

  const handleSwitchChange = (checked: boolean) => {
    addDebugInfo(`Switch changed to: ${checked}`);
    setIsEnabled(checked);
    toast.success(`Voice ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleButtonClick = () => {
    const newState = !isEnabled;
    addDebugInfo(`Button clicked, toggling to: ${newState}`);
    setIsEnabled(newState);
    toast.success(`Voice ${newState ? 'enabled' : 'disabled'} via button`);
  };

  useEffect(() => {
    addDebugInfo(`State updated to: ${isEnabled}`);
  }, [isEnabled]);

  return (
    <Card className="fixed bottom-40 left-4 z-50 p-4 w-80">
      <h3 className="text-sm font-medium mb-3">Voice Settings Debug</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Current State:</span>
          <span className={`text-sm font-medium ${isEnabled ? 'text-green-500' : 'text-red-500'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Switch Control:</span>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleSwitchChange}
          />
        </div>
        
        <Button 
          onClick={handleButtonClick}
          variant={isEnabled ? "default" : "outline"}
          className="w-full"
        >
          Toggle via Button
        </Button>
        
        <div className="text-xs">
          <div className="font-medium mb-1">Debug Log:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-muted-foreground">
                {info}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
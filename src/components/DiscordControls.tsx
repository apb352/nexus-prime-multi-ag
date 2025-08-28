import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DiscordLogo, CheckCircle, XCircle, Share } from '@phosphor-icons/react';
import { discordService, DiscordSettings } from '@/lib/discord-service';
import { DiscordSettingsComponent } from './DiscordSettings';
import { AIAgent } from '@/lib/types';
import { toast } from 'sonner';

interface DiscordControlsProps {
  agent: AIAgent;
  onAgentUpdate: (agent: AIAgent) => void;
  className?: string;
}

export function DiscordControls({ agent, onAgentUpdate, className }: DiscordControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [discordSettings, setDiscordSettings] = useState<DiscordSettings>(
    agent.discordSettings || discordService.getSettings()
  );
  const [isConnected, setIsConnected] = useState(discordService.isConnected());
  const [bridgeEnabled, setBridgeEnabled] = useState(agent.discordSettings?.bridgeMessages ?? false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(discordService.isConnected());
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSettingsChange = async (newSettings: DiscordSettings) => {
    setDiscordSettings(newSettings);
    
    // Update agent with new discord settings
    const updatedAgent = {
      ...agent,
      discordSettings: newSettings
    };
    onAgentUpdate(updatedAgent);

    try {
      await discordService.updateSettings(newSettings);
      setIsConnected(discordService.isConnected());
    } catch (error) {
      console.error('Failed to update Discord settings:', error);
    }
  };

  const handleBridgeToggle = (enabled: boolean) => {
    setBridgeEnabled(enabled);
    const newSettings = {
      ...discordSettings,
      bridgeMessages: enabled
    };
    handleSettingsChange(newSettings);
  };

  const handleTestMessage = async () => {
    if (!isConnected || !discordSettings.enabled) {
      toast.error('Discord not connected');
      return;
    }

    try {
      const testMessage = `🤖 Test message from ${agent.name} in Nexus Prime!`;
      
      if (discordSettings.webhookUrl) {
        await discordService.sendWebhookMessage(testMessage, agent.name);
      } else {
        await discordService.sendMessage(testMessage, agent.name);
      }
      
      toast.success('Test message sent to Discord!');
    } catch (error) {
      console.error('Failed to send test message:', error);
      toast.error('Failed to send test message');
    }
  };

  const getConnectionStatus = () => {
    if (!discordSettings.enabled) {
      return { icon: <XCircle className="w-3 h-3" />, text: 'Disabled', color: 'text-muted-foreground' };
    }
    if (isConnected) {
      return { icon: <CheckCircle className="w-3 h-3" />, text: 'Connected', color: 'text-green-400' };
    }
    return { icon: <XCircle className="w-3 h-3" />, text: 'Disconnected', color: 'text-red-400' };
  };

  const status = getConnectionStatus();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative ${className}`}
          title="Discord Settings"
        >
          <DiscordLogo size={16} className="mr-1" />
          <span className={`text-xs ${status.color}`}>
            {status.icon}
          </span>
          {bridgeEnabled && isConnected && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 discord-controls-popover z-[2500]" 
        side="top"
        align="end"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DiscordLogo size={20} className="text-primary" />
              <h3 className="font-semibold">Discord Controls</h3>
            </div>
            <Badge variant="outline" className={status.color}>
              {status.icon}
              <span className="ml-1">{status.text}</span>
            </Badge>
          </div>

          {isConnected && discordSettings.enabled && (
            <>
              <Separator />
              
              {/* Quick Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Bridge Messages</Label>
                    <div className="text-xs text-muted-foreground">
                      Send {agent.name}'s messages to Discord
                    </div>
                  </div>
                  <Switch
                    checked={bridgeEnabled}
                    onCheckedChange={handleBridgeToggle}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestMessage}
                  className="w-full"
                  disabled={!bridgeEnabled}
                  title="Send test message to Discord channel"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Send Test Message
                </Button>

                {discordSettings.channelId && (
                  <div className="text-xs text-muted-foreground">
                    Connected to: #{discordSettings.channelId}
                  </div>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Full Settings */}
          <div className="max-h-96 overflow-y-auto">
            <DiscordSettingsComponent
              settings={discordSettings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
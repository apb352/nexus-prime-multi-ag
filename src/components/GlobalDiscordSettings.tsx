import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DiscordLogo, Gear } from '@phosphor-icons/react';
import { DiscordSettingsComponent } from './DiscordSettings';
import { discordService, DiscordSettings } from '@/lib/discord-service';

export function GlobalDiscordSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<DiscordSettings>(discordService.getSettings());
  const [isConnected, setIsConnected] = useState(discordService.isConnected());

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(discordService.isConnected());
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSettingsChange = async (newSettings: DiscordSettings) => {
    setSettings(newSettings);
    try {
      await discordService.updateSettings(newSettings);
      setIsConnected(discordService.isConnected());
    } catch (error) {
      console.error('Failed to update Discord settings:', error);
    }
  };

  const getStatusBadge = () => {
    if (!settings.enabled) {
      return <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>;
    }
    if (isConnected) {
      return <Badge variant="outline" className="text-green-400 border-green-400">Connected</Badge>;
    }
    return <Badge variant="outline" className="text-red-400 border-red-400">Disconnected</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <DiscordLogo className="w-4 h-4 mr-2" />
          Discord
          {isConnected && settings.enabled && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DiscordLogo className="w-5 h-5 text-primary" />
            Global Discord Settings
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <DiscordSettingsComponent
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
        
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">How Discord Integration Works</CardTitle>
            <CardDescription>
              Connect your AI agents to Discord for seamless communication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Bot Token:</strong> Create a Discord application and bot at the Discord Developer Portal to get your bot token.
            </div>
            <div>
              <strong>Message Bridging:</strong> Enable individual agents to send their responses to Discord channels automatically.
            </div>
            <div>
              <strong>Webhooks:</strong> Use webhooks for better formatting and custom agent avatars in Discord.
            </div>
            <div>
              <strong>Commands:</strong> Allow Discord users to interact with your agents through commands.
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
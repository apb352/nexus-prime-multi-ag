import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DiscordLogo, CheckCircle, XCircle, Settings } from '@phosphor-icons/react';
import { discordService, DiscordSettings } from '@/lib/discord-service';
import { DiscordBotManager } from './DiscordBotManager';

interface DiscordStatusProps {
  className?: string;
}

export function DiscordStatus({ className }: DiscordStatusProps) {
  const [settings, setSettings] = useState<DiscordSettings>(discordService.getSettings());
  const [isConnected, setIsConnected] = useState(false);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const connected = discordService.isConnected();
      setIsConnected(connected);
      
      // If enabled but not connected, try to reconnect
      if (settings.enabled && settings.botToken && !connected) {
        try {
          await discordService.connect();
          setIsConnected(discordService.isConnected());
        } catch (error) {
          // Silent fail for status checks
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [settings]);

  const getStatusColor = () => {
    if (!settings.enabled) return 'text-muted-foreground border-muted-foreground';
    if (isConnected) return 'text-green-400 border-green-400';
    return 'text-red-400 border-red-400';
  };

  const getStatusIcon = () => {
    if (!settings.enabled) return <XCircle className="w-3 h-3" />;
    if (isConnected) return <CheckCircle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const getStatusText = () => {
    if (!settings.enabled) return 'Discord: Off';
    if (isConnected) return 'Discord: On';
    return 'Discord: Error';
  };

  return (
    <Popover open={showManager} onOpenChange={setShowManager}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative ${className}`}
          title="Discord Integration Status"
        >
          <DiscordLogo size={14} className="mr-1" />
          <Badge variant="outline" className={`${getStatusColor()} text-xs px-1 py-0`}>
            {getStatusIcon()}
          </Badge>
          {isConnected && settings.enabled && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[500px] p-0 z-[2500]" 
        side="top"
        align="end"
      >
        <DiscordBotManager />
      </PopoverContent>
    </Popover>
  );
}
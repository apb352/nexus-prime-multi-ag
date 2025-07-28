import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DiscordLogo, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Settings, 
  Users,
  MessageCircle,
  Robot,
  Lightbulb,
  BookOpen
} from '@phosphor-icons/react';
import { DiscordBotSetup } from './DiscordBotSetup';
import { GlobalDiscordSettings } from './GlobalDiscordSettings';
import { DiscordTutorial } from './DiscordTutorial';
import { discordService, DiscordSettings } from '@/lib/discord-service';
import { toast } from 'sonner';

interface DiscordBotManagerProps {
  className?: string;
}

export function DiscordBotManager({ className }: DiscordBotManagerProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [settings, setSettings] = useState<DiscordSettings>(discordService.getSettings());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  useEffect(() => {
    checkConnection();
    
    // Check connection status periodically
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    const connected = discordService.isConnected();
    setIsConnected(connected);
    
    if (settings.enabled && settings.botToken) {
      try {
        const result = await discordService.testConnection();
        setConnectionStatus(result.message);
      } catch (error) {
        setConnectionStatus('Connection failed');
      }
    } else {
      setConnectionStatus('Not configured');
    }
  };

  const handleSetupComplete = (newSettings: DiscordSettings) => {
    setSettings(newSettings);
    setShowSetup(false);
    checkConnection();
    toast.success('Discord bot setup completed successfully!');
  };

  const handleSettingsUpdate = (newSettings: DiscordSettings) => {
    setSettings(newSettings);
    checkConnection();
  };

  const handleDisconnect = async () => {
    try {
      await discordService.updateSettings({
        ...settings,
        enabled: false
      });
      setSettings(prev => ({ ...prev, enabled: false }));
      discordService.disconnect();
      setIsConnected(false);
      toast.success('Disconnected from Discord');
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const getStatusColor = () => {
    if (!settings.enabled) return 'text-muted-foreground';
    if (isConnected) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (!settings.enabled) return <XCircle className="w-4 h-4" />;
    if (isConnected) return <CheckCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!settings.enabled) return 'Disabled';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DiscordLogo size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Discord Integration
                  <Badge variant="outline" className={getStatusColor()}>
                    {getStatusIcon()}
                    <span className="ml-1">{getStatusText()}</span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Connect your AI agents to Discord servers
                </CardDescription>
              </div>
            </div>
            
            {settings.enabled && isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!settings.enabled || !settings.botToken ? (
            // Setup State
            <div className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  Set up a Discord bot to enable two-way communication between your AI agents and Discord servers.
                  Your agents can send messages to channels and respond to Discord users.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageCircle className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">Two-way Chat</h4>
                    <p className="text-xs text-muted-foreground">Agents can send and receive messages</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">Multi-Server</h4>
                    <p className="text-xs text-muted-foreground">Connect to multiple Discord servers</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Robot className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">Agent Commands</h4>
                    <p className="text-xs text-muted-foreground">Discord users can interact with agents</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTutorial(true)}
                  className="flex-1"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Tutorial
                </Button>

                <Button
                  onClick={() => setShowSetup(true)}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Set Up Discord Bot
                </Button>
              </div>
            </div>
          ) : (
            // Connected State
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Connection Status</div>
                  <div className={`text-sm ${getStatusColor()}`}>
                    {connectionStatus}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Features Enabled</div>
                  <div className="flex flex-wrap gap-1">
                    {settings.bridgeMessages && (
                      <Badge variant="secondary" className="text-xs">Message Bridge</Badge>
                    )}
                    {settings.syncAgentStatus && (
                      <Badge variant="secondary" className="text-xs">Status Sync</Badge>
                    )}
                    {settings.allowCommands && (
                      <Badge variant="secondary" className="text-xs">Commands</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Settings
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {isConnected && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    Discord bot is connected and ready! Your agents can now communicate with Discord servers.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tutorial Modal */}
      {showTutorial && (
        <DiscordTutorial
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Setup Modal */}
      {showSetup && (
        <DiscordBotSetup
          onClose={() => setShowSetup(false)}
          onComplete={handleSetupComplete}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <GlobalDiscordSettings
          onClose={() => setShowSettings(false)}
          onSettingsUpdate={handleSettingsUpdate}
        />
      )}
    </>
  );
}
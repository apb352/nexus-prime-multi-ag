import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink, Zap } from '@phosphor-icons/react';
import { discordService, DiscordSettings, DiscordGuild, DiscordChannel } from '@/lib/discord-service';
import { toast } from 'sonner';

interface DiscordSettingsProps {
  settings: DiscordSettings;
  onSettingsChange: (settings: DiscordSettings) => void;
}

export function DiscordSettingsComponent({ settings, onSettingsChange }: DiscordSettingsProps) {
  const [localSettings, setLocalSettings] = useState<DiscordSettings>(settings);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    if (settings.enabled && discordService.isConnected()) {
      setConnectionStatus('connected');
      loadGuilds();
    }
  }, [settings]);

  const handleSettingChange = (key: keyof DiscordSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleConnect = async () => {
    if (!localSettings.botToken) {
      toast.error('Bot token is required');
      return;
    }

    setIsConnecting(true);
    setTestResult(null);

    try {
      await discordService.updateSettings(localSettings);
      setConnectionStatus('connected');
      toast.success('Connected to Discord!');
      loadGuilds();
    } catch (error) {
      setConnectionStatus('error');
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    discordService.disconnect();
    setConnectionStatus('disconnected');
    setGuilds([]);
    setChannels([]);
    handleSettingChange('enabled', false);
    toast.success('Disconnected from Discord');
  };

  const handleTestConnection = async () => {
    if (!localSettings.botToken) {
      toast.error('Bot token is required');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await discordService.testConnection();
      setTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
      toast.error('Connection test failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadGuilds = async () => {
    if (!discordService.isConnected()) return;

    setLoadingGuilds(true);
    try {
      const guildsList = await discordService.getGuilds();
      setGuilds(guildsList);
    } catch (error) {
      console.error('Failed to load guilds:', error);
      toast.error('Failed to load Discord servers');
    } finally {
      setLoadingGuilds(false);
    }
  };

  const loadChannels = async (guildId: string) => {
    if (!discordService.isConnected()) return;

    setLoadingChannels(true);
    try {
      const channelsList = await discordService.getChannels(guildId);
      setChannels(channelsList);
    } catch (error) {
      console.error('Failed to load channels:', error);
      toast.error('Failed to load Discord channels');
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleGuildSelect = (guildId: string) => {
    handleSettingChange('guildId', guildId);
    handleSettingChange('channelId', ''); // Reset channel selection
    setChannels([]);
    loadChannels(guildId);
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="outline" className="text-green-400 border-green-400"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-400 border-red-400"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Disconnected</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Discord Integration
            </CardTitle>
            <CardDescription>
              Connect your AI agents to Discord servers and channels
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Discord */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Discord Integration</Label>
            <div className="text-sm text-muted-foreground">
              Allow agents to interact with Discord
            </div>
          </div>
          <Switch
            checked={localSettings.enabled}
            onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>

        {localSettings.enabled && (
          <>
            <Separator />

            {/* Bot Token */}
            <div className="space-y-2">
              <Label htmlFor="bot-token">Bot Token</Label>
              <div className="flex gap-2">
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="Your Discord bot token..."
                  value={localSettings.botToken || ''}
                  onChange={(e) => handleSettingChange('botToken', e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={isConnecting || !localSettings.botToken}
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                </Button>
              </div>
              {testResult && (
                <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                  <AlertDescription className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-xs text-muted-foreground">
                Create a bot at{' '}
                <a 
                  href="https://discord.com/developers/applications" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Discord Developer Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Connection Buttons */}
            <div className="flex gap-2">
              {connectionStatus !== 'connected' ? (
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting || !localSettings.botToken}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect to Discord'
                  )}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleDisconnect}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              )}
            </div>

            {connectionStatus === 'connected' && (
              <>
                <Separator />

                {/* Server Selection */}
                <div className="space-y-2">
                  <Label>Discord Server</Label>
                  <Select 
                    value={localSettings.guildId || ''} 
                    onValueChange={handleGuildSelect}
                    disabled={loadingGuilds}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingGuilds ? "Loading servers..." : "Select a server"} />
                    </SelectTrigger>
                    <SelectContent>
                      {guilds.map((guild) => (
                        <SelectItem key={guild.id} value={guild.id}>
                          {guild.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Channel Selection */}
                {localSettings.guildId && (
                  <div className="space-y-2">
                    <Label>Discord Channel</Label>
                    <Select 
                      value={localSettings.channelId || ''} 
                      onValueChange={(value) => handleSettingChange('channelId', value)}
                      disabled={loadingChannels}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingChannels ? "Loading channels..." : "Select a channel"} />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={localSettings.webhookUrl || ''}
                    onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Use webhooks for better message formatting and custom avatars
                  </div>
                </div>

                <Separator />

                {/* Additional Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Bridge Messages</Label>
                      <div className="text-xs text-muted-foreground">
                        Send agent messages to Discord
                      </div>
                    </div>
                    <Switch
                      checked={localSettings.bridgeMessages}
                      onCheckedChange={(checked) => handleSettingChange('bridgeMessages', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Sync Agent Status</Label>
                      <div className="text-xs text-muted-foreground">
                        Update Discord status when agents come online
                      </div>
                    </div>
                    <Switch
                      checked={localSettings.syncAgentStatus}
                      onCheckedChange={(checked) => handleSettingChange('syncAgentStatus', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Allow Commands</Label>
                      <div className="text-xs text-muted-foreground">
                        Let Discord users send commands to agents
                      </div>
                    </div>
                    <Switch
                      checked={localSettings.allowCommands}
                      onCheckedChange={(checked) => handleSettingChange('allowCommands', checked)}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
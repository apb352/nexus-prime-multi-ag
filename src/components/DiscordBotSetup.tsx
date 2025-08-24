import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  DiscordLogo, 
  CheckCircle, 
  XCircle, 
  Copy, 
  ExternalLink, 
  Lightbulb,
  Robot,
  Globe,
  Users,
  Warning
} from '@phosphor-icons/react';
import { discordService, DiscordSettings, DiscordGuild, DiscordChannel } from '@/lib/discord-service';
import { toast } from 'sonner';

interface DiscordBotSetupProps {
  onClose: () => void;
  onComplete: (settings: DiscordSettings) => void;
}

export function DiscordBotSetup({ onClose, onComplete }: DiscordBotSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<DiscordSettings>({
    enabled: true,
    bridgeMessages: true,
    syncAgentStatus: true,
    allowCommands: true
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const steps = [
    'Create Discord Application',
    'Configure Bot Token',
    'Invite Bot to Server',
    'Select Server & Channel',
    'Final Configuration'
  ];

  const handleBotTokenChange = (token: string) => {
    setSettings(prev => ({ ...prev, botToken: token }));
    setConnectionStatus(null);
    setGuilds([]);
    setChannels([]);
  };

  const testConnection = async () => {
    if (!settings.botToken) {
      toast.error('Please enter a bot token');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await discordService.testConnection();
      setConnectionStatus(result);
      
      if (result.success) {
        // Load guilds after successful connection
        await loadGuilds();
        toast.success('Successfully connected to Discord!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      setConnectionStatus({ success: false, message: 'Connection failed' });
      toast.error('Failed to test connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadGuilds = async () => {
    if (!settings.botToken) return;

    setLoadingGuilds(true);
    try {
      // Update settings first to enable the connection
      await discordService.updateSettings(settings);
      const guildList = await discordService.getGuilds();
      setGuilds(guildList);
    } catch (error) {
      console.error('Failed to load guilds:', error);
      toast.error('Failed to load servers');
    } finally {
      setLoadingGuilds(false);
    }
  };

  const loadChannels = async (guildId: string) => {
    if (!guildId) return;

    setLoadingChannels(true);
    try {
      const channelList = await discordService.getChannels(guildId);
      setChannels(channelList);
    } catch (error) {
      console.error('Failed to load channels:', error);
      toast.error('Failed to load channels');
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleGuildSelect = (guildId: string) => {
    setSettings(prev => ({ ...prev, guildId, channelId: undefined }));
    setChannels([]);
    loadChannels(guildId);
  };

  const handleChannelSelect = (channelId: string) => {
    setSettings(prev => ({ ...prev, channelId }));
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Clipboard not available');
    }
  };

  const openDiscordDeveloperPortal = () => {
    if (typeof window !== 'undefined') {
      window.open('https://discord.com/developers/applications', '_blank');
    }
  };

  const generateInviteLink = () => {
    if (!settings.botToken) return '';
    
    // Extract application ID from bot token (first part before the dot)
    const applicationId = settings.botToken.split('.')[0];
    const permissions = '8192'; // Send Messages permission
    const scope = 'bot';
    
    return `https://discord.com/api/oauth2/authorize?client_id=${applicationId}&permissions=${permissions}&scope=${scope}`;
  };

  const completeSetup = async () => {
    try {
      await discordService.updateSettings(settings);
      onComplete(settings);
      toast.success('Discord bot setup completed!');
    } catch (error) {
      console.error('Failed to complete setup:', error);
      toast.error('Failed to complete setup');
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0: return true; // Instructions step
      case 1: return settings.botToken && connectionStatus?.success; // Token step
      case 2: return settings.botToken && connectionStatus?.success; // Invite step
      case 3: return settings.guildId && settings.channelId; // Server selection
      case 4: return true; // Final configuration
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DiscordLogo size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Discord Bot Setup</CardTitle>
                <CardDescription>
                  Connect Nexus Prime to your Discord server
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index < currentStep ? 'bg-green-500 text-white' :
                  index === currentStep ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    index < currentStep ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 0: Create Discord Application */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Robot className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Create a Discord Application</h3>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  You'll need to create a Discord bot application to connect Nexus Prime to your server.
                  This is free and takes just a few minutes.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">1</span>
                    Visit Discord Developer Portal
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Go to Discord's developer portal to create a new application
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={openDiscordDeveloperPortal}
                    className="ml-8"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Developer Portal
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">2</span>
                    Create New Application
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Click "New Application" and give it a name (e.g., "Nexus Prime Bot")
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">3</span>
                    Navigate to Bot Section
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    In your application, go to the "Bot" section in the left sidebar
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">4</span>
                    Create Bot
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Click "Add Bot" to create a bot user for your application
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Configure Bot Token */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Configure Bot Token</h3>
              </div>

              <Alert>
                <Warning className="h-4 w-4" />
                <AlertDescription>
                  Your bot token is like a password - keep it secure and never share it publicly!
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="bot-token">Bot Token</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    From your Discord application's "Bot" section, copy the bot token
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="bot-token"
                      type="password"
                      placeholder="Enter your Discord bot token..."
                      value={settings.botToken || ''}
                      onChange={(e) => handleBotTokenChange(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={testConnection}
                      disabled={!settings.botToken || isConnecting}
                      variant="outline"
                    >
                      {isConnecting ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>

                {connectionStatus && (
                  <Alert className={connectionStatus.success ? 'border-green-500' : 'border-red-500'}>
                    {connectionStatus.success ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <XCircle className="h-4 w-4 text-red-500" />
                    }
                    <AlertDescription className={connectionStatus.success ? 'text-green-700' : 'text-red-700'}>
                      {connectionStatus.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">How to get your bot token:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>In your Discord application's Bot section</li>
                    <li>Under "Token", click "Reset Token" (or "Copy" if visible)</li>
                    <li>Copy the generated token and paste it above</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Invite Bot to Server */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Invite Bot to Your Server</h3>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  You need to invite the bot to a Discord server where you have permission to add bots.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Auto-generated invite link:</h4>
                  <div className="flex gap-2">
                    <Input
                      value={generateInviteLink()}
                      readOnly
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(generateInviteLink())}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open(generateInviteLink(), '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Invite Bot
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Steps to invite your bot:</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">1</span>
                      <div>
                        <p className="font-medium">Click "Invite Bot" above</p>
                        <p className="text-sm text-muted-foreground">This will open Discord's OAuth authorization page</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">2</span>
                      <div>
                        <p className="font-medium">Select your server</p>
                        <p className="text-sm text-muted-foreground">Choose the Discord server where you want to add the bot</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">3</span>
                      <div>
                        <p className="font-medium">Authorize permissions</p>
                        <p className="text-sm text-muted-foreground">Grant the bot permission to send messages</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Server & Channel */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Select Server & Channel</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Discord Server</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select the server where you invited the bot
                  </p>
                  <Select value={settings.guildId} onValueChange={handleGuildSelect}>
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

                {settings.guildId && (
                  <div>
                    <Label>Text Channel</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Choose the channel where the bot will send messages
                    </p>
                    <Select value={settings.channelId} onValueChange={handleChannelSelect}>
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
              </div>

              {guilds.length === 0 && !loadingGuilds && connectionStatus?.success && (
                <Alert>
                  <Warning className="h-4 w-4" />
                  <AlertDescription>
                    No servers found. Make sure you've invited the bot to a server and have the proper permissions.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 4: Final Configuration */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Final Configuration</h3>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Configuration Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bot Status:</span>
                      <Badge variant="outline" className="text-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Server:</span>
                      <span>{guilds.find(g => g.id === settings.guildId)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel:</span>
                      <span>#{channels.find(c => c.id === settings.channelId)?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Bot Features</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="bridge-messages">Bridge Messages</Label>
                      <p className="text-xs text-muted-foreground">Send AI agent messages to Discord</p>
                    </div>
                    <Switch
                      id="bridge-messages"
                      checked={settings.bridgeMessages}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, bridgeMessages: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sync-status">Sync Agent Status</Label>
                      <p className="text-xs text-muted-foreground">Update Discord activity when agents are active</p>
                    </div>
                    <Switch
                      id="sync-status"
                      checked={settings.syncAgentStatus}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, syncAgentStatus: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-commands">Allow Commands</Label>
                      <p className="text-xs text-muted-foreground">Let Discord users interact with agents via commands</p>
                    </div>
                    <Switch
                      id="allow-commands"
                      checked={settings.allowCommands}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowCommands: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNextStep()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={completeSetup}
                  disabled={!canProceedToNextStep()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
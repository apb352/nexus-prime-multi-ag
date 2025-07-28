import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DiscordLogo, 
  Lightbulb, 
  CheckCircle, 
  Robot,
  MessageCircle,
  Users,
  Gear,
  Link,
  Warning
} from '@phosphor-icons/react';

interface DiscordTutorialProps {
  onClose: () => void;
}

export function DiscordTutorial({ onClose }: DiscordTutorialProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DiscordLogo size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Discord Integration Guide</CardTitle>
                <CardDescription>
                  Connect your AI agents to Discord servers for seamless community interaction
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overview */}
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Discord integration allows your AI agents to communicate with Discord servers, enabling community 
              interaction and extending conversations beyond Nexus Prime.
            </AlertDescription>
          </Alert>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm mb-1">Two-Way Communication</h3>
                <p className="text-xs text-muted-foreground">
                  AI agents can send messages to Discord and respond to Discord users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Robot className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm mb-1">Custom Avatars</h3>
                <p className="text-xs text-muted-foreground">
                  Each agent can have unique Discord avatars using webhooks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm mb-1">Multi-Server Support</h3>
                <p className="text-xs text-muted-foreground">
                  Connect to multiple Discord servers and channels
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Setup Process */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Gear className="w-5 h-5" />
              Setup Process
            </h3>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Create Discord Application</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit the Discord Developer Portal and create a new application. This generates 
                    the bot token needed for authentication.
                  </p>
                  <Badge variant="outline" className="text-xs">
                    <Link className="w-3 h-3 mr-1" />
                    discord.com/developers
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Configure Bot Token</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy your bot token from the Discord application and paste it into Nexus Prime. 
                    The system will automatically validate the connection.
                  </p>
                  <Badge variant="outline" className="text-xs text-amber-600">
                    <Warning className="w-3 h-3 mr-1" />
                    Keep token secure
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Invite Bot to Server</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the auto-generated invite link to add your bot to Discord servers. 
                    You need "Manage Server" permission on the target server.
                  </p>
                  <Badge variant="outline" className="text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Auto-generated link
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Select Server & Channel</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose which Discord server and text channel your AI agents will use for communication.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Configure Agent Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable Discord integration for individual agents and configure message bridging, 
                    commands, and other features.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Features Explanation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Features</h3>

            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Message Bridging</h4>
                <p className="text-xs text-muted-foreground">
                  When enabled, AI agent responses are automatically sent to the configured Discord channel. 
                  Perfect for sharing conversations with your community.
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Webhook Support</h4>
                <p className="text-xs text-muted-foreground">
                  Use Discord webhooks to send messages with custom agent names and avatars, 
                  making each agent appear as a distinct user in Discord.
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Status Synchronization</h4>
                <p className="text-xs text-muted-foreground">
                  Automatically update Discord activity status when agents become active or inactive, 
                  keeping your community informed about agent availability.
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Command System</h4>
                <p className="text-xs text-muted-foreground">
                  Allow Discord users to interact with your AI agents through commands, 
                  enabling community members to chat with agents directly from Discord.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tips & Best Practices */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tips & Best Practices</h3>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>Security:</strong> Never share your bot token publicly. Treat it like a password and 
                regenerate it if it's ever compromised.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Do:</h4>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Test your bot in a private server first</li>
                  <li>• Use descriptive agent names for clarity</li>
                  <li>• Set up webhooks for better formatting</li>
                  <li>• Monitor Discord rate limits</li>
                  <li>• Configure appropriate permissions</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">❌ Don't:</h4>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Share bot tokens publicly</li>
                  <li>• Spam Discord channels</li>
                  <li>• Bridge every message unnecessarily</li>
                  <li>• Ignore Discord community guidelines</li>
                  <li>• Forget to test before going live</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} className="w-full sm:w-auto">
              Got It, Let's Set Up Discord!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export interface DiscordSettings {
  enabled: boolean;
  botToken?: string;
  guildId?: string;
  channelId?: string;
  webhookUrl?: string;
  bridgeMessages: boolean;
  syncAgentStatus: boolean;
  allowCommands: boolean;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  guild_id?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: string;
  channel_id: string;
}

class DiscordService {
  private settings: DiscordSettings | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageListeners: ((message: DiscordMessage) => void)[] = [];

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem('nexus-discord-settings');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load Discord settings:', error);
    }
  }

  private saveSettings() {
    if (this.settings) {
      localStorage.setItem('nexus-discord-settings', JSON.stringify(this.settings));
    }
  }

  async updateSettings(newSettings: DiscordSettings) {
    this.settings = { ...newSettings };
    this.saveSettings();
    
    if (newSettings.enabled && newSettings.botToken) {
      try {
        await this.connect();
      } catch (error) {
        console.error('Failed to connect with new settings:', error);
        // Don't throw here, just log the error
        this.connected = false;
      }
    } else {
      this.disconnect();
    }
  }

  getSettings(): DiscordSettings {
    return this.settings || {
      enabled: false,
      bridgeMessages: true,
      syncAgentStatus: true,
      allowCommands: true
    };
  }

  async connect(): Promise<boolean> {
    if (!this.settings?.enabled || !this.settings.botToken) {
      throw new Error('Discord bot token is required');
    }

    try {
      // Test the bot token by fetching bot user info
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bot ${this.settings.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Invalid bot token - please check your token');
        } else if (response.status === 403) {
          throw new Error('Bot token lacks necessary permissions');
        } else if (response.status === 429) {
          throw new Error('Rate limited - please try again in a moment');
        }
        
        throw new Error(`Discord API error: ${response.status}`);
      }

      const botUser = await response.json();
      console.log('Connected to Discord as:', botUser.username);
      
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Start listening for messages if webhook is configured
      if (this.settings.webhookUrl) {
        this.startWebhookListener();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Discord:', error);
      this.connected = false;
      throw error;
    }
  }

  disconnect() {
    this.connected = false;
    console.log('Disconnected from Discord');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getGuilds(): Promise<DiscordGuild[]> {
    if (!this.connected || !this.settings?.botToken) {
      throw new Error('Not connected to Discord');
    }

    try {
      const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          'Authorization': `Bot ${this.settings.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch guilds: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Discord guilds:', error);
      throw error;
    }
  }

  async getChannels(guildId: string): Promise<DiscordChannel[]> {
    if (!this.connected || !this.settings?.botToken) {
      throw new Error('Not connected to Discord');
    }

    try {
      const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: {
          'Authorization': `Bot ${this.settings.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.status}`);
      }

      const channels = await response.json();
      // Filter to text channels only
      return channels.filter((channel: DiscordChannel) => channel.type === 0);
    } catch (error) {
      console.error('Failed to fetch Discord channels:', error);
      throw error;
    }
  }

  async sendMessage(content: string, agentName?: string): Promise<boolean> {
    if (!this.connected || !this.settings?.channelId || !this.settings?.botToken) {
      throw new Error('Discord not properly configured');
    }

    try {
      const messageContent = agentName ? `**${agentName}:** ${content}` : content;
      
      const response = await fetch(`https://discord.com/api/v10/channels/${this.settings.channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${this.settings.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send Discord message:', error);
      throw error;
    }
  }

  async sendWebhookMessage(content: string, agentName?: string, avatarUrl?: string): Promise<boolean> {
    if (!this.settings?.webhookUrl) {
      throw new Error('Discord webhook not configured');
    }

    try {
      const response = await fetch(this.settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          username: agentName || 'Nexus Prime',
          avatar_url: avatarUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send webhook message: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send Discord webhook message:', error);
      throw error;
    }
  }

  private startWebhookListener() {
    // In a real implementation, you would set up a webhook endpoint
    // For now, we'll simulate message listening
    console.log('Discord webhook listener started');
  }

  addMessageListener(callback: (message: DiscordMessage) => void) {
    this.messageListeners.push(callback);
  }

  removeMessageListener(callback: (message: DiscordMessage) => void) {
    const index = this.messageListeners.indexOf(callback);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.settings?.botToken) {
        return { success: false, message: 'Bot token is required' };
      }

      // Test the bot token by fetching bot user info
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bot ${this.settings.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          return { success: false, message: 'Invalid bot token - please check your token' };
        } else if (response.status === 403) {
          return { success: false, message: 'Bot token lacks necessary permissions' };
        } else if (response.status === 429) {
          return { success: false, message: 'Rate limited - please try again in a moment' };
        }
        
        return { success: false, message: `Discord API error: ${response.status}` };
      }

      const botUser = await response.json();
      
      // Update connection state
      this.connected = true;
      this.reconnectAttempts = 0;
      
      return { success: true, message: `Connected as ${botUser.username}#${botUser.discriminator}` };
    } catch (error) {
      this.connected = false;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, message: 'Network error - check your internet connection' };
      }
      
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}

export const discordService = new DiscordService();
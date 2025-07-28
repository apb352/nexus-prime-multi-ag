import { VoiceSettings } from './voice-service';
import { InternetSettings } from './internet-service';
import { DiscordSettings } from './discord-service';
import { ImageSettings } from './image-service';

export interface AIAgent {
  id: string;
  name: string;
  mood: string;
  avatar: string;
  personality: string;
  color: string;
  isActive: boolean;
  voiceSettings?: VoiceSettings;
  internetSettings?: InternetSettings;
  discordSettings?: DiscordSettings;
  imageSettings?: ImageSettings;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  agentId: string;
  imageUrl?: string;
  imagePrompt?: string;
}

export interface ChatWindow {
  id: string;
  agentId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  selectedModel: string;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  internetEnabled?: boolean;
  autoSearch?: boolean;
  discordEnabled?: boolean;
  discordBridge?: boolean;
  imageEnabled?: boolean;
  showCanvas?: boolean;
}

export type Theme = 'cyberpunk' | 'minimalist' | 'cozy';

export interface AppState {
  theme: Theme;
  agents: AIAgent[];
  chatWindows: ChatWindow[];
  chatHistory: Record<string, ChatMessage[]>;
}
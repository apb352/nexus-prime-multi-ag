import { VoiceSettings } from './voice-service';

export interface AIAgent {
  id: string;
  name: string;
  mood: string;
  avatar: string;
  personality: string;
  color: string;
  isActive: boolean;
  voiceSettings: VoiceSettings;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  agentId: string;
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
}

export type Theme = 'cyberpunk' | 'minimalist' | 'cozy';

export interface AppState {
  theme: Theme;
  agents: AIAgent[];
  chatWindows: ChatWindow[];
  chatHistory: Record<string, ChatMessage[]>;
}
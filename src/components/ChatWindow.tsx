import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Minus, Send, Settings } from '@phosphor-icons/react';
import { AIAgent, ChatMessage, ChatWindow as ChatWindowType } from '@/lib/types';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useAgents } from '@/hooks/use-agents';
import { Avatar3D } from './Avatar3D';
import { VoiceControls } from './VoiceControls';
import { voiceService, VOICE_PROFILES, VoiceSettings } from '@/lib/voice-service';

interface ChatWindowProps {
  window: ChatWindowType;
  agent: AIAgent;
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onUpdatePosition: (windowId: string, position: { x: number; y: number }) => void;
  onUpdateSize: (windowId: string, size: { width: number; height: number }) => void;
}

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Default)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
];

export function ChatWindow({
  window,
  agent,
  onClose,
  onMinimize,
  onUpdatePosition,
  onUpdateSize
}: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(window.selectedModel || 'gpt-4o');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { addMessage, getAgentHistory } = useChatHistory();
  const { updateAgent } = useAgents();
  const messages = getAgentHistory(agent.id);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message
    addMessage(agent.id, {
      content: userMessage,
      sender: 'user',
      agentId: agent.id
    });

    try {
      // Create AI prompt using spark.llmPrompt
      const prompt = spark.llmPrompt`You are ${agent.name}, an AI with the following personality: ${agent.personality}. Your current mood is ${agent.mood}. Respond to this message in character: ${userMessage}`;
      
      // Get AI response
      const aiResponse = await spark.llm(prompt, selectedModel);
      
      // Add AI message
      addMessage(agent.id, {
        content: aiResponse,
        sender: 'ai',
        agentId: agent.id
      });

      // Auto-speak the AI response if enabled
      if (agent.voiceSettings?.enabled && agent.voiceSettings?.autoSpeak) {
        try {
          if (agent.voiceSettings?.profile) {
            await voiceService.speak(aiResponse, agent.voiceSettings.profile);
          }
        } catch (error) {
          console.error('Voice synthesis failed:', error);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      addMessage(agent.id, {
        content: errorMessage,
        sender: 'ai',
        agentId: agent.id
      });

      // Speak error message if voice is enabled
      if (agent.voiceSettings?.enabled && agent.voiceSettings?.autoSpeak) {
        try {
          if (agent.voiceSettings?.profile) {
            await voiceService.speak(errorMessage, agent.voiceSettings.profile);
          }
        } catch (voiceError) {
          console.error('Voice synthesis failed:', voiceError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdatePosition(window.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      
      if (isResizing) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          const newWidth = Math.max(300, e.clientX - rect.left);
          const newHeight = Math.max(400, e.clientY - rect.top);
          onUpdateSize(window.id, {
            width: newWidth,
            height: newHeight
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, window.id, onUpdatePosition, onUpdateSize]);

  const handleVoiceSettingsChange = (newVoiceSettings: VoiceSettings) => {
    updateAgent({
      ...agent,
      voiceSettings: newVoiceSettings
    });
  };

  const handleSpeakMessage = async (text: string) => {
    try {
      if (agent.voiceSettings?.profile) {
        await voiceService.speak(text, agent.voiceSettings.profile);
      }
    } catch (error) {
      console.error('Voice synthesis failed:', error);
    }
  };

  if (window.isMinimized) {
    return (
      <div
        className="fixed bottom-4 bg-card border border-border rounded-lg p-3 cursor-pointer shadow-lg"
        style={{
          left: window.position.x,
          zIndex: 1000
        }}
        onClick={() => onMinimize(window.id)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8">
            <Avatar3D
              avatarType={agent.avatar}
              color={agent.color}
              isActive={true}
              size={32}
            />
          </div>
          <span className="text-sm font-medium">{agent.name}</span>
        </div>
      </div>
    );
  }

  return (
    <Card
      ref={windowRef}
      className="fixed bg-card/95 backdrop-blur-md border-2 shadow-2xl overflow-hidden"
      style={{
        left: window.position.x,
        top: window.position.y,
        width: window.size.width,
        height: window.size.height,
        borderColor: agent.color,
        boxShadow: `0 0 30px ${agent.color}30`,
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-border cursor-move select-none"
        onMouseDown={handleMouseDown}
        style={{ backgroundColor: `${agent.color}20` }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8">
            <Avatar3D
              avatarType={agent.avatar}
              color={agent.color}
              isActive={true}
              size={32}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.mood}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <VoiceControls
            voiceSettings={agent.voiceSettings}
            onVoiceSettingsChange={handleVoiceSettingsChange}
            onSpeak={handleSpeakMessage}
            className="mr-2"
          />
          
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[2000]">
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMinimize(window.id)}
          >
            <Minus size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClose(window.id)}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto"
        style={{ height: 'calc(100% - 140px)' }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border'
              }`}
              style={{
                backgroundColor: msg.sender === 'ai' ? `${agent.color}20` : undefined,
                borderColor: msg.sender === 'ai' ? agent.color : undefined
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2 rounded-lg border border-border"
              style={{
                backgroundColor: `${agent.color}20`,
                borderColor: agent.color
              }}
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Message ${agent.name}... (Shift+Enter for new line)`}
            className="flex-1 min-h-0 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            size="sm"
            style={{ backgroundColor: agent.color }}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-transparent hover:bg-border/50 transition-colors"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
        }}
      >
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-muted-foreground/50" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/30" />
      </div>
    </Card>
  );
}
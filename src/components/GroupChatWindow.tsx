import { useState, useRef, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { GroupChat, GroupChatMessage, AIAgent } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  X, 
  Minus, 
  Send, 
  Settings, 
  Users, 
  SkipForward,
  Play,
  Pause,
  Crown,
  MessageCircle
} from '@phosphor-icons/react';

interface GroupChatWindowProps {
  groupChat: GroupChat;
  agents: AIAgent[];
  onClose: (groupChatId: string) => void;
  onMinimize: (groupChatId: string) => void;
  onUpdatePosition: (groupChatId: string, position: { x: number; y: number }) => void;
  onUpdateSize: (groupChatId: string, size: { width: number; height: number }) => void;
  onUpdateGroupChat?: (groupChatId: string, updates: Partial<GroupChat>) => void;
}

export function GroupChatWindow({
  groupChat,
  agents,
  onClose,
  onMinimize,
  onUpdatePosition,
  onUpdateSize,
  onUpdateGroupChat
}: GroupChatWindowProps) {
  const [messages, setMessages] = useKV<GroupChatMessage[]>(`group-chat-${groupChat.id}`, []);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const participantAgents = agents.filter(agent => groupChat.participants.includes(agent.id));
  const currentAgent = participantAgents[groupChat.currentTurn];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: GroupChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: Date.now(),
      agentId: 'user',
      agentName: 'You'
    };

    setMessages(current => [...current, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      if (groupChat.turnBasedMode) {
        // In turn-based mode, only the current agent responds
        await generateAgentResponse(currentAgent, [...messages, userMessage]);
        
        // Auto-advance to next turn if enabled
        if (groupChat.autoAdvanceTurn) {
          setTimeout(() => {
            handleNextTurn();
          }, 1000);
        }
      } else {
        // In free-form mode, all agents can respond
        // Add small delays between responses for natural flow
        for (let i = 0; i < participantAgents.length; i++) {
          setTimeout(() => {
            generateAgentResponse(participantAgents[i], [...messages, userMessage]);
          }, i * 2000);
        }
      }
    } catch (error) {
      console.error('Error generating responses:', error);
      toast.error('Failed to generate response');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAgentResponse = async (agent: AIAgent, currentMessages: GroupChatMessage[]) => {
    if (!agent) return;

    const conversationHistory = currentMessages
      .slice(-10) // Last 10 messages for context
      .map(m => `${m.agentName}: ${m.content}`)
      .join('\n');

    const prompt = spark.llmPrompt`You are ${agent.name}, an AI agent with this personality: ${agent.personality}

Current mood: ${agent.mood}

You are participating in a group chat with other AI agents. Here's the recent conversation:
${conversationHistory}

Respond as ${agent.name} in character. Keep your response conversational and engaging, around 1-2 sentences. Show your unique personality and interact naturally with the other participants.`;

    try {
      const response = await spark.llm(prompt, groupChat.selectedModel);

      const aiMessage: GroupChatMessage = {
        id: Date.now().toString() + '-' + agent.id,
        content: response,
        sender: 'ai',
        timestamp: Date.now(),
        agentId: agent.id,
        agentName: agent.name
      };

      setMessages(current => [...current, aiMessage]);
    } catch (error) {
      console.error(`Error generating response for ${agent.name}:`, error);
    }
  };

  const handleNextTurn = () => {
    const nextTurn = (groupChat.currentTurn + 1) % participantAgents.length;
    if (onUpdateGroupChat) {
      onUpdateGroupChat(groupChat.id, { currentTurn: nextTurn });
    }
    toast.info(`Turn passed to ${participantAgents[nextTurn]?.name}`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: groupChat.size.width,
      height: groupChat.size.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdatePosition(groupChat.id, {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (isResizing) {
        const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));
        onUpdateSize(groupChat.id, { width: newWidth, height: newHeight });
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
  }, [isDragging, isResizing, dragOffset, resizeStart, groupChat.id, onUpdatePosition, onUpdateSize]);

  if (groupChat.isMinimized) {
    return null;
  }

  return (
    <Card
      ref={windowRef}
      className="fixed z-[2000] border-2 border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl"
      style={{
        left: groupChat.position.x,
        top: groupChat.position.y,
        width: groupChat.size.width,
        height: groupChat.size.height
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="drag-handle flex items-center justify-between p-3 border-b border-border bg-muted/20 rounded-t-lg cursor-move">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-primary" weight="fill" />
          <h3 className="font-semibold text-sm">{groupChat.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {participantAgents.length} agents
          </Badge>
          {groupChat.turnBasedMode && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Crown size={12} />
              {currentAgent?.name}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings size={14} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Model</Label>
                  <Select value={groupChat.selectedModel}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Turn-based mode</Label>
                  <Switch checked={groupChat.turnBasedMode} />
                </div>
                
                {groupChat.turnBasedMode && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Auto-advance turns</Label>
                    <Switch checked={groupChat.autoAdvanceTurn} />
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Participants</Label>
                  <div className="flex flex-wrap gap-1">
                    {participantAgents.map((agent, index) => (
                      <Badge
                        key={agent.id}
                        variant={groupChat.turnBasedMode && index === groupChat.currentTurn ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {agent.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onMinimize(groupChat.id)}>
            <Minus size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onClose(groupChat.id)}>
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" style={{ height: groupChat.size.height - 140 }}>
        <div className="space-y-4">
          {messages.map((message) => {
            const agent = agents.find(a => a.id === message.agentId);
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && agent && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 shadow-sm" 
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.avatar}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-1' : ''}`}>
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.sender === 'ai' && (
                      <div className="text-xs text-muted-foreground mb-1 font-medium">
                        {message.agentName}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
          {isGenerating && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-xs">Agents are thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-muted/10">
        {groupChat.turnBasedMode && (
          <div className="flex items-center justify-between mb-3 p-2 bg-muted/20 rounded">
            <div className="flex items-center gap-2 text-sm">
              <Crown size={16} className="text-primary" />
              <span>Current turn: <strong>{currentAgent?.name}</strong></span>
            </div>
            <Button variant="outline" size="sm" onClick={handleNextTurn}>
              <SkipForward size={14} />
              Next Turn
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isGenerating}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isGenerating}
            className="self-end"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-muted/50 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </Card>
  );
}
import { useState, useRef, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { GroupChat, GroupChatMessage, AIAgent, FileAttachment } from '@/lib/types';
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
import { FileUploadButton, QuickFileButtons } from './FileUpload';
import { AttachmentList, InlineAttachment } from './AttachmentPreview';
import { fileService } from '@/lib/file-service';
import { toast } from 'sonner';
import { 
  X, 
  Minus, 
  Send, 
  Settings, 
  Users,
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
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const participantAgents = agents.filter(agent => groupChat.participants.includes(agent.id));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating) return;

    const messageAttachments = [...attachments];
    const userMessage: GroupChatMessage = {
      id: Date.now().toString(),
      content: input.trim() || 'Shared files:',
      sender: 'user',
      timestamp: Date.now(),
      agentId: 'user',
      agentName: 'You',
      attachments: messageAttachments
    };

    setMessages(current => [...current, userMessage]);
    setInput('');
    setAttachments([]);
    setIsGenerating(true);

    try {
      if (groupChat.turnBasedMode) {
        // In turn-based mode, generate responses for each agent in sequence
        await generateTurnBasedResponses([...messages, userMessage]);
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

  const generateTurnBasedResponses = async (currentMessages: GroupChatMessage[]) => {
    // Generate responses for each agent in sequence, one at a time
    for (let i = 0; i < participantAgents.length; i++) {
      const agent = participantAgents[i];
      if (!agent) continue;

      // Show which agent is currently responding
      toast.info(`${agent.name} is responding...`, { duration: 2000 });
      
      // Wait a bit before generating the response for natural pacing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await generateAgentResponse(agent, currentMessages);
      
      // Add a delay between agents for better user experience
      if (i < participantAgents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // All agents have responded, ready for user's next message
    toast.success('All agents have responded. Your turn!');
  };

  const generateAgentResponse = async (agent: AIAgent, currentMessages: GroupChatMessage[]) => {
    if (!agent) return;

    // Build conversation history with file attachments
    const conversationHistory = await Promise.all(
      currentMessages
        .slice(-10) // Last 10 messages for context
        .map(async (m) => {
          let messageText = `${m.agentName}: ${m.content}`;
          
          // Add attachment context if present
          if (m.attachments && m.attachments.length > 0) {
            try {
              const attachmentDescriptions = await Promise.all(
                m.attachments.map(async (attachment) => {
                  try {
                    return await fileService.getFileDescription(attachment);
                  } catch (error) {
                    return `File: ${attachment.name} (${fileService.formatFileSize(attachment.size)})`;
                  }
                })
              );
              messageText += `\n[Shared files: ${attachmentDescriptions.join(', ')}]`;
            } catch (error) {
              messageText += `\n[Shared ${m.attachments.length} file(s)]`;
            }
          }
          
          return messageText;
        })
    );

    const conversationHistoryText = (await Promise.all(conversationHistory)).join('\n');

    const turnBasedContext = groupChat.turnBasedMode 
      ? "You are in a turn-based group conversation. After the user speaks, each agent gets one turn to respond. Keep your response focused and meaningful since everyone will get a chance to speak."
      : "You are in a free-flowing group conversation with other AI agents.";

    const prompt = spark.llmPrompt`You are ${agent.name}, an AI agent with this personality: ${agent.personality}

Current mood: ${agent.mood}

${turnBasedContext}

Here's the recent conversation:
${conversationHistoryText}

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
              <Users size={12} />
              Turn-based
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
                  <Select 
                    value={groupChat.selectedModel}
                    onValueChange={(value) => {
                      if (onUpdateGroupChat) {
                        onUpdateGroupChat(groupChat.id, { selectedModel: value as 'gpt-4o' | 'gpt-4o-mini' });
                      }
                    }}
                  >
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
                  <Switch 
                    checked={groupChat.turnBasedMode}
                    onCheckedChange={(checked) => {
                      if (onUpdateGroupChat) {
                        onUpdateGroupChat(groupChat.id, { turnBasedMode: checked });
                      }
                    }}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Participants</Label>
                  <div className="flex flex-wrap gap-1">
                    {participantAgents.map((agent) => (
                      <Badge
                        key={agent.id}
                        variant="secondary"
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
                    
                    {/* Display attachments if present */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment) => (
                          <InlineAttachment 
                            key={attachment.id} 
                            attachment={attachment} 
                          />
                        ))}
                      </div>
                    )}
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
          <div className="flex items-center justify-center mb-3 p-2 bg-primary/10 rounded border border-primary/20">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Users size={16} />
              <span>Turn-based mode: Each agent will respond after you send a message</span>
            </div>
          </div>
        )}
        
        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="mb-3">
            <AttachmentList
              attachments={attachments}
              onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
              className="max-h-40 overflow-y-auto"
            />
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isGenerating}
            />
            
            {/* File upload button inside textarea */}
            <div className="absolute right-2 top-2">
              <FileUploadButton 
                onFileSelect={(newAttachments) => 
                  setAttachments(prev => [...prev, ...newAttachments])
                }
                className="p-1"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={(!input.trim() && attachments.length === 0) || isGenerating}
            className="self-end"
          >
            <Send size={16} />
          </Button>
        </div>
        
        {/* Quick file buttons */}
        <div className="flex justify-between items-center mt-2">
          <QuickFileButtons 
            onFileSelect={(newAttachments) => 
              setAttachments(prev => [...prev, ...newAttachments])
            }
          />
          <div className="text-xs text-muted-foreground">
            {attachments.length > 0 && `${attachments.length} file(s) attached`}
          </div>
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
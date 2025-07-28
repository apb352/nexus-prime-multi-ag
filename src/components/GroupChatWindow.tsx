import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X, Minus, Send, Users, Play, Pause, StopCircle, SpeakerHigh } from '@phosphor-icons/react';
import { AIAgent, ChatMessage, ChatWindow as ChatWindowType } from '@/lib/types';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useAgents } from '@/hooks/use-agents';
import { useAbortManager } from '@/hooks/use-abort-manager';
import { Avatar3D } from './Avatar3D';
import { GroupAgentManager } from './GroupAgentManager';
import { InternetControls } from './InternetControls';
import { VoiceVisualization } from './VoiceVisualization';
import { internetService } from '@/lib/internet-service';
import { formatDistanceToNow } from 'date-fns';

interface GroupChatWindowProps {
  window: ChatWindowType;
  agents: AIAgent[];
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onUpdatePosition: (windowId: string, position: { x: number; y: number }) => void;
  onUpdateSize: (windowId: string, size: { width: number; height: number }) => void;
  onUpdateWindow?: (windowId: string, updates: Partial<ChatWindowType>) => void;
}

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Default)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
];

export function GroupChatWindow({
  window,
  agents,
  onClose,
  onMinimize,
  onUpdatePosition,
  onUpdateSize,
  onUpdateWindow
}: GroupChatWindowProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(window.selectedModel || 'gpt-4o');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoInterval, setAutoInterval] = useState<NodeJS.Timeout | null>(null);
  const [internetEnabled, setInternetEnabled] = useState(window.internetEnabled ?? false);
  const [autoSearch, setAutoSearch] = useState(window.autoSearch ?? false);
  const [currentAbortController, setCurrentAbortController] = useState<AbortController | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { addMessage, getGroupHistory } = useChatHistory();
  const { createAbortController, abortWindow } = useAbortManager();
  const { agents: allAgents, updateAgentStatus } = useAgents();
  const groupMessages = getGroupHistory(window.id);

  // Find agents in this group
  const groupAgents = agents.filter(agent => 
    window.groupAgents?.includes(agent.id)
  );

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [groupMessages]);

  useEffect(() => {
    // Cleanup auto mode on unmount
    return () => {
      if (autoInterval) {
        clearInterval(autoInterval);
      }
    };
  }, [autoInterval]);

  const handleWindowClick = () => {
    setZIndex(Math.max(1001, Date.now() % 10000));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('drag-handle') || target.closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y
      });
      handleWindowClick(); // Bring to front
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      onUpdatePosition(window.id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isResizing) {
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

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      agentId: 'user',
      isGroupMessage: true,
      groupId: window.id
    };

    addMessage('user', userMessage);
    setMessage('');
    setIsLoading(true);

    // Create abort controller for this operation
    const abortController = createAbortController(window.id);
    setCurrentAbortController(abortController);

    try {
      // Generate responses from all agents in the group
      for (const agent of groupAgents) {
        if (abortController.signal.aborted) {
          break;
        }
        await generateAgentResponse(agent, userMessage, abortController);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation cancelled') {
        console.log('Group chat operation cancelled');
        return;
      }
      console.error('Error generating group responses:', error);
    } finally {
      setIsLoading(false);
      setCurrentAbortController(null);
    }
  };

  const generateAgentResponse = async (agent: AIAgent, triggerMessage: ChatMessage, abortController?: AbortController) => {
    try {
      // Check if spark is available
      if (typeof spark === 'undefined' || !spark.llm || !spark.llmPrompt) {
        throw new Error('AI service is not available. Please refresh the page.');
      }

      // Check if aborted before starting
      if (abortController?.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      const conversationHistory = groupMessages
        .slice(-10) // Last 10 messages for context
        .map(msg => {
          if (msg.sender === 'user') {
            return `User: ${msg.content}`;
          } else {
            const msgAgent = groupAgents.find(a => a.id === msg.agentId);
            return `${msgAgent?.name || 'Agent'}: ${msg.content}`;
          }
        })
        .join('\n');

      const otherAgents = groupAgents.filter(a => a.id !== agent.id);
      const agentNames = otherAgents.map(a => a.name).join(', ');

      // Create simple AI prompt for group chat
      const agentName = agent?.name || 'AI Assistant';
      const agentPersonality = agent?.personality || 'helpful and friendly';
      const agentMood = agent?.mood || 'neutral';
      const topicName = window.groupTopic || 'general discussion';

      let prompt: string;
      let response: string;
      
      try {
        prompt = spark.llmPrompt`You are ${agentName}, an AI with personality: ${agentPersonality}. Your mood is ${agentMood}. You're in a group discussion about: ${topicName}. Other participants: ${agentNames} and the user. Recent conversation: ${conversationHistory}. Latest message from ${triggerMessage.sender === 'user' ? 'the user' : 'another agent'}: ${triggerMessage.content}. Respond naturally as ${agentName} in 1-3 sentences.`;
        response = await spark.llm(prompt, selectedModel);
      } catch (llmError) {
        // If prompt fails due to content filtering, try simpler prompt
        if (llmError instanceof Error && (llmError.message.includes('content_filter') || llmError.message.includes('ResponsibleAIPolicyViolation'))) {
          console.log('Group chat prompt failed content filter, trying simpler prompt...');
          const simplePrompt = spark.llmPrompt`You are ${agentName}. Respond to: ${triggerMessage.content}`;
          response = await spark.llm(simplePrompt, selectedModel);
        } else {
          console.error('Error creating group chat prompt:', llmError);
          throw new Error('Failed to create prompt');
        }
      }

      // Check if aborted before adding message
      if (abortController?.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-${agent.id}`,
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        agentId: agent.id,
        isGroupMessage: true,
        groupId: window.id
      };

      addMessage(agent.id, aiMessage);
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation cancelled') {
        throw error; // Re-throw cancellation errors
      }
      
      console.error(`Error generating response for ${agent?.name || 'agent'}:`, error);
      
      // Provide more detailed error messages
      let errorMessage = `${agent?.name || 'Agent'}: Sorry, I encountered an error. Please try again.`;
      
      if (error instanceof Error) {
        if (error.message.includes('AI service is not available')) {
          errorMessage = `${agent?.name || 'Agent'}: AI service is currently unavailable. Please refresh the page.`;
        } else if (error.message.includes('Failed to create prompt')) {
          errorMessage = `${agent?.name || 'Agent'}: Failed to process the message. Please try again.`;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = `${agent?.name || 'Agent'}: Network error occurred. Please check your connection.`;
        }
        
        // Log detailed error for debugging
        console.error('Detailed group chat error:', {
          message: error.message,
          stack: error.stack,
          agentId: agent?.id,
          windowId: window.id
        });
      }
      
      // Add error message to chat
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-${agent?.id || 'error'}`,
        content: errorMessage,
        sender: 'ai',
        timestamp: new Date(),
        agentId: agent?.id || 'error',
        isGroupMessage: true,
        groupId: window.id
      };

      addMessage(agent?.id || 'error', aiMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStopGeneration = () => {
    if (currentAbortController) {
      abortWindow(window.id);
      setIsLoading(false);
      setCurrentAbortController(null);
    }
  };

  const toggleAutoMode = () => {
    if (isAutoMode) {
      // Stop auto mode
      if (autoInterval) {
        clearInterval(autoInterval);
        setAutoInterval(null);
      }
      setIsAutoMode(false);
      // Also stop any current generation
      handleStopGeneration();
    } else {
      // Start auto mode - agents discuss among themselves
      setIsAutoMode(true);
      const interval = setInterval(async () => {
        if (groupAgents.length > 0 && !isLoading) {
          const randomAgent = groupAgents[Math.floor(Math.random() * groupAgents.length)];
          const lastMessage = groupMessages[groupMessages.length - 1];
          
          if (lastMessage) {
            // Create abort controller for auto-generated messages
            const autoAbortController = createAbortController(`${window.id}-auto`);
            try {
              await generateAgentResponse(randomAgent, lastMessage, autoAbortController);
            } catch (error) {
              if (!(error instanceof Error && error.message === 'Operation cancelled')) {
                console.error('Auto mode error:', error);
              }
            }
          }
        }
      }, 8000); // Every 8 seconds
      setAutoInterval(interval);
    }
  };

  const handleAddAgentsToGroup = (agentIds: string[]) => {
    if (!onUpdateWindow) return;
    
    const newGroupAgents = [...(window.groupAgents || []), ...agentIds];
    onUpdateWindow(window.id, { groupAgents: newGroupAgents });
    
    // Mark new agents as active
    agentIds.forEach(agentId => {
      updateAgentStatus(agentId, true);
    });
  };

  const handleRemoveAgentFromGroup = (agentId: string) => {
    if (!onUpdateWindow || !window.groupAgents) return;
    
    // Don't allow removing if only 2 agents left
    if (window.groupAgents.length <= 2) return;
    
    const newGroupAgents = window.groupAgents.filter(id => id !== agentId);
    onUpdateWindow(window.id, { groupAgents: newGroupAgents });
    
    // Check if agent has other active windows, if not mark as inactive
    const agentHasOtherWindows = false; // We'd need to check this from parent component
    if (!agentHasOtherWindows) {
      updateAgentStatus(agentId, false);
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
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">
            Group: {window.groupTopic || 'Discussion'}
          </span>
          <Badge variant="secondary" className="text-xs">
            {groupAgents.length}
          </Badge>
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
        borderColor: '#8b5cf6',
        boxShadow: '0 0 30px #8b5cf630',
        zIndex: zIndex
      }}
      onClick={handleWindowClick}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-border cursor-move select-none drag-handle"
        onMouseDown={handleMouseDown}
        style={{ backgroundColor: '#8b5cf620' }}
      >
        <div className="flex items-center space-x-3 drag-handle flex-1">
          <Users className="w-6 h-6 text-primary drag-handle" />
          <div className="drag-handle flex-1">
            <h3 className="font-semibold text-foreground flex items-center gap-2 drag-handle">
              <span className="drag-handle">Group Chat</span>
              <Badge variant="secondary" className="text-xs">
                {groupAgents.length} agents
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground truncate drag-handle">
              {window.groupTopic || 'Discussion'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {isLoading && (
            <Button
              onClick={handleStopGeneration}
              variant="destructive"
              size="sm"
              title="Stop generation"
            >
              <StopCircle size={16} />
            </Button>
          )}
          
          <Button
            variant={isAutoMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleAutoMode}
            title={isAutoMode ? "Stop auto discussion" : "Start auto discussion"}
          >
            {isAutoMode ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <InternetControls
            agentId="group"
            windowId={window.id}
            internetEnabled={internetEnabled}
            autoSearch={autoSearch}
            onInternetToggle={setInternetEnabled}
            onAutoSearchToggle={setAutoSearch}
          />
          
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

      {/* Participants */}
      <div className="p-2 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Participants:</span>
          <GroupAgentManager
            currentAgents={window.groupAgents || []}
            allAgents={allAgents}
            onAddAgents={handleAddAgentsToGroup}
            onRemoveAgent={handleRemoveAgentFromGroup}
          />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-0" ref={messagesRef}>
        <div className="p-4 space-y-4">
          {groupMessages.map((msg) => {
            const agent = msg.sender === 'user' ? null : groupAgents.find(a => a.id === msg.agentId);
            
            return (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 relative ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                  style={
                    agent
                      ? {
                          backgroundColor: `${agent.color}20`,
                          borderLeft: `3px solid ${agent.color}`
                        }
                      : undefined
                  }
                >
                  {/* Voice visualization for AI messages */}
                  {agent && agent.voiceSettings?.enabled && (
                    <VoiceVisualization
                      isActive={isSpeaking && speakingMessageId === msg.id}
                      variant="floating"
                    />
                  )}
                  
                  {agent && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4">
                        <Avatar3D
                          avatarType={agent.avatar}
                          color={agent.color}
                          isActive={true}
                          size={16}
                          mood={agent.mood || 'neutral'}
                          isSpeaking={isSpeaking && speakingMessageId === msg.id}
                        />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: agent.color }}>
                        {agent.name}
                      </span>
                      
                      {/* Global voice indicator in agent name area */}
                      {agent.voiceSettings?.enabled && isSpeaking && speakingMessageId === msg.id && (
                        <VoiceVisualization
                          isActive={true}
                          variant="inline"
                        />
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-70">
                      {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                    </p>
                    
                    {/* Manual speak button for AI messages */}
                    {agent && agent.voiceSettings?.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Add manual speak function */}}
                        disabled={isSpeaking}
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        title="Speak this message"
                      >
                        <SpeakerHigh size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[80%] relative">
                {/* Voice visualization for group thinking */}
                <VoiceVisualization
                  isActive={false}
                  variant="floating"
                />
                
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Agents are thinking...</span>
                  
                  {/* Show group voice prep indicator */}
                  <VoiceVisualization
                    isActive={false}
                    variant="inline"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            placeholder={`Join the discussion about ${window.groupTopic}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 min-h-[40px] max-h-32 resize-none"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              onClick={handleStopGeneration}
              variant="destructive"
              size="sm"
              className="h-10"
            >
              <StopCircle size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="sm"
              className="h-10"
            >
              <Send size={16} />
            </Button>
          )}
        </div>
        
        {isAutoMode && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto discussion mode active
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsResizing(true);
          setDragStart({
            x: window.position.x,
            y: window.position.y
          });
        }}
      >
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-muted-foreground/50" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/30" />
      </div>
    </Card>
  );
}
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Minus, Send, Settings, SpeakerHigh } from '@phosphor-icons/react';
import { AIAgent, ChatMessage, ChatWindow as ChatWindowType } from '@/lib/types';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useAgents } from '@/hooks/use-agents';
import { Avatar3D } from './Avatar3D';
import { VoiceControls } from './VoiceControls';
import { InternetControls } from './InternetControls';
import { DiscordControls } from './DiscordControls';
import { SpeakingOverlay } from './SpeakingOverlay';
import { VoiceVisualization } from './VoiceVisualization';
import { voiceService, VOICE_PROFILES, VoiceSettings } from '@/lib/voice-service';
import { discordService } from '@/lib/discord-service';
import { createEnhancedChatPrompt, createBasicChatPrompt, cleanUserMessage } from '@/lib/chat-utils';

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
  const [zIndex, setZIndex] = useState(1500);
  const [internetEnabled, setInternetEnabled] = useState(agent.internetSettings?.enabled ?? false);
  const [autoSearch, setAutoSearch] = useState(agent.internetSettings?.autoSearch ?? false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSpeakingOverlay, setShowSpeakingOverlay] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // Update internet settings when agent changes
  useEffect(() => {
    setInternetEnabled(agent.internetSettings?.enabled ?? false);
    setAutoSearch(agent.internetSettings?.autoSearch ?? false);
  }, [agent.internetSettings]);
  
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

  const handleTestAPI = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setIsTestMode(true);
    
    try {
      console.log('Testing basic API connectivity...');
      
      if (typeof spark === 'undefined') {
        throw new Error('Spark API is not available');
      }
      
      const testPrompt = spark.llmPrompt`Hello! This is a simple test message. Please respond with "API test successful".`;
      const response = await spark.llm(testPrompt, selectedModel);
      
      addMessage(agent.id, {
        content: `API Test Result: ${response}`,
        sender: 'ai',
        agentId: agent.id
      });
      
      console.log('API test successful!');
      
    } catch (error) {
      console.error('API test failed:', error);
      addMessage(agent.id, {
        content: `API Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'ai',
        agentId: agent.id
      });
    } finally {
      setIsLoading(false);
      setIsTestMode(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = cleanUserMessage(message.trim());
    setMessage('');
    setIsLoading(true);

    // Add user message
    addMessage(agent.id, {
      content: userMessage,
      sender: 'user',
      agentId: agent.id
    });

    try {
      console.log('Starting chat message handling for:', userMessage);
      console.log('Internet enabled:', internetEnabled, 'Auto search:', autoSearch);

      // Basic validation with better error handling
      if (typeof window === 'undefined') {
        throw new Error('Window object is not available');
      }

      if (typeof spark === 'undefined') {
        console.error('Spark global object not found. Available globals:', Object.keys(window));
        throw new Error('Spark API is not available - please check if the Spark runtime is properly loaded');
      }

      if (!spark.llm) {
        console.error('Spark.llm method not found. Available spark methods:', Object.keys(spark));
        throw new Error('Spark LLM method is not available');
      }

      if (!spark.llmPrompt) {
        console.error('Spark.llmPrompt method not found. Available spark methods:', Object.keys(spark));
        throw new Error('Spark LLM prompt method is not available');
      }

      if (!userMessage || userMessage.length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (!agent || !agent.name) {
        throw new Error('Agent information is missing');
      }

      // Create enhanced prompt with internet context
      let aiResponse: string;
      
      try {
        console.log('Creating enhanced prompt with internet capabilities...');
        
        const promptResult = await createEnhancedChatPrompt({
          internetEnabled,
          autoSearch,
          userMessage,
          agentName: agent.name,
          agentPersonality: agent.personality,
          agentMood: agent.mood
        });
        
        console.log('Enhanced prompt created. Internet context:', promptResult.hasInternetContext);
        console.log('Internet enabled:', internetEnabled, 'Auto search:', autoSearch);
        console.log('Prompt summary:', promptResult.internetSummary);
        console.log('Final prompt (first 300 chars):', promptResult.prompt.substring(0, 300));
        
        // Create the spark prompt properly
        const finalPrompt = spark.llmPrompt`${promptResult.prompt}`;
        
        console.log('Calling spark.llm with model:', selectedModel);
        aiResponse = await spark.llm(finalPrompt, selectedModel);
        
      } catch (enhancedError) {
        console.log('Enhanced prompt failed, trying basic prompt...', enhancedError);
        
        // Check if it's a content filter error immediately
        const enhancedErrorMessage = enhancedError?.message || String(enhancedError);
        if (enhancedErrorMessage.includes('content_filter') || 
            enhancedErrorMessage.includes('content management policy') || 
            enhancedErrorMessage.includes('ResponsibleAIPolicyViolation') ||
            enhancedErrorMessage.includes('jailbreak') ||
            enhancedErrorMessage.includes('filtered')) {
          aiResponse = "I understand you'd like to chat, but I need to keep our conversation within certain guidelines. Could you please rephrase your message in a different way? I'm here to help with information, creative tasks, and friendly conversation!";
        } else {
          try {
            // Try basic prompt with agent personality
            const basicPromptText = createBasicChatPrompt(userMessage, agent.name, agent.personality, agent.mood);
            const basicPrompt = spark.llmPrompt`${basicPromptText}`;
            aiResponse = await spark.llm(basicPrompt, selectedModel);
            
          } catch (basicError) {
            console.log('Basic prompt failed, trying minimal prompt...', basicError);
            
            // Check for content filter error on basic prompt too
            const basicErrorMessage = basicError?.message || String(basicError);
            if (basicErrorMessage.includes('content_filter') || 
                basicErrorMessage.includes('content management policy') || 
                basicErrorMessage.includes('ResponsibleAIPolicyViolation') ||
                basicErrorMessage.includes('jailbreak') ||
                basicErrorMessage.includes('filtered')) {
              aiResponse = "I understand you'd like to chat, but I need to keep our conversation within certain guidelines. Could you please rephrase your message in a different way? I'm here to help with information, creative tasks, and friendly conversation!";
            } else {
              try {
                // Final fallback - ultra-simple prompt
                const minimalPrompt = spark.llmPrompt`Please help with: ${userMessage}`;
                aiResponse = await spark.llm(minimalPrompt, selectedModel);
              } catch (minimalError) {
                console.log('All prompts failed, providing fallback response...', minimalError);
                
                // Check if this is a content filter error
                const errorMessage = minimalError?.message || String(minimalError);
                if (errorMessage.includes('content_filter') || 
                    errorMessage.includes('content management policy') || 
                    errorMessage.includes('ResponsibleAIPolicyViolation') ||
                    errorMessage.includes('jailbreak') ||
                    errorMessage.includes('filtered')) {
                  aiResponse = "I understand you'd like to chat, but I need to keep our conversation within certain guidelines. Could you please rephrase your message in a different way? I'm here to help with information, creative tasks, and friendly conversation!";
                } else if (errorMessage.includes('HTTP2_PROTOCOL_ERROR') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
                  aiResponse = "I'm having a brief connection hiccup. Let me try that again - could you please resend your message?";
                } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
                  aiResponse = "I encountered an issue processing that request. Could you try rephrasing your message differently?";
                } else {
                  aiResponse = "I'm sorry, I'm having trouble responding right now. Please try rephrasing your message or try again later.";
                }
              }
            }
          }
        }
      }
      
      console.log('Received AI response type:', typeof aiResponse);
      console.log('AI response length:', aiResponse?.length || 0);
      console.log('AI response preview:', aiResponse?.substring(0, 100) + '...');
      
      if (!aiResponse || typeof aiResponse !== 'string') {
        console.error('Invalid response type received:', typeof aiResponse);
        throw new Error('Invalid response from AI service');
      }

      if (aiResponse.length === 0) {
        console.error('Empty response received');
        throw new Error('Empty response from AI service');
      }
      
      // Add AI message
      const aiMessage = addMessage(agent.id, {
        content: aiResponse,
        sender: 'ai',
        agentId: agent.id
      });

      console.log('AI message added successfully');

      // Bridge message to Discord if enabled
      if (agent.discordSettings?.enabled && agent.discordSettings?.bridgeMessages && discordService.isConnected()) {
        try {
          if (agent.discordSettings.webhookUrl) {
            await discordService.sendWebhookMessage(aiResponse, agent.name);
          } else {
            await discordService.sendMessage(aiResponse, agent.name);
          }
          console.log('Message bridged to Discord successfully');
        } catch (discordError) {
          console.error('Failed to bridge message to Discord:', discordError);
          // Don't show error to user as this is not critical
        }
      }

      // Auto-speak the AI response if enabled with speaking overlay
      if (agent.voiceSettings?.enabled && agent.voiceSettings?.autoSpeak) {
        try {
          if (agent.voiceSettings?.profile) {
            setIsSpeaking(true);
            setShowSpeakingOverlay(true);
            setSpeakingMessageId(aiMessage.id);
            
            // Enhanced voice synthesis with lip sync
            await voiceService.speakWithLipSync(
              aiResponse, 
              agent.voiceSettings.profile,
              (level: number) => setVoiceLevel(level)
            );
            
            setIsSpeaking(false);
            setSpeakingMessageId(null);
            setTimeout(() => setShowSpeakingOverlay(false), 500);
          }
        } catch (error) {
          console.error('Voice synthesis failed:', error);
          setIsSpeaking(false);
          setSpeakingMessageId(null);
          setShowSpeakingOverlay(false);
        }
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      let errorMessage = 'Sorry, I encountered an error processing your message.';
      
      if (error instanceof Error) {
        console.error('Detailed error:', error.message);
        if (error.stack) {
          console.error('Error stack:', error.stack);
        }
        
        // Provide more specific error messages
        if (error.message.includes('content_filter') || error.message.includes('ResponsibleAIPolicyViolation')) {
          errorMessage = 'I apologize, but I cannot process that request due to content policies. Please try rephrasing your message in a different way.';
        } else if (error.message.includes('HTTP2_PROTOCOL_ERROR') || error.message.includes('net::ERR_HTTP2_PROTOCOL_ERROR')) {
          errorMessage = 'Connection error detected. Please try again in a moment.';
        } else if (error.message.includes('Failed to load resource')) {
          errorMessage = 'Network connectivity issue. Please check your connection and try again.';
        } else if (error.message.includes('Spark API')) {
          errorMessage = 'AI services are temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('Invalid response')) {
          errorMessage = 'Received an invalid response. Please try rephrasing your message.';
        } else if (error.message.includes('Empty response')) {
          errorMessage = 'No response received. Please try again.';
        } else if (error.message.includes('Weather service')) {
          errorMessage = 'Weather service is temporarily unavailable, but I can still help with other questions.';
        } else if (error.message.includes('Internet')) {
          errorMessage = 'Internet services are experiencing issues, but I can still help with general questions.';
        } else if (error.message.includes('properly loaded')) {
          errorMessage = 'The AI system is still loading. Please wait a moment and try again.';
        } else if (error.message.includes('LLM request failed: 400')) {
          errorMessage = 'Your message triggered a content filter. Please try rephrasing your question.';
        }
      }
      
      addMessage(agent.id, {
        content: errorMessage,
        sender: 'ai',
        agentId: agent.id
      });

      // Speak error message if voice is enabled
      if (agent.voiceSettings?.enabled && agent.voiceSettings?.autoSpeak) {
        try {
          if (agent.voiceSettings?.profile) {
            setIsSpeaking(true);
            setShowSpeakingOverlay(true);
            setSpeakingMessageId(null); // Error messages don't get specific IDs
            
            await voiceService.speakWithLipSync(
              errorMessage, 
              agent.voiceSettings.profile,
              (level: number) => setVoiceLevel(level)
            );
            
            setIsSpeaking(false);
            setSpeakingMessageId(null);
            setTimeout(() => setShowSpeakingOverlay(false), 500);
          }
        } catch (voiceError) {
          console.error('Voice synthesis failed:', voiceError);
          setIsSpeaking(false);
          setSpeakingMessageId(null);
          setShowSpeakingOverlay(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWindowClick = () => {
    // Bring window to front
    setZIndex(1500 + Date.now() % 1000);
  };

  const handleManualSpeak = async (message: ChatMessage) => {
    if (!agent.voiceSettings?.enabled || !agent.voiceSettings?.profile || isSpeaking) {
      return;
    }

    try {
      setIsSpeaking(true);
      setShowSpeakingOverlay(true);
      setSpeakingMessageId(message.id);
      
      await voiceService.speakWithLipSync(
        message.content, 
        agent.voiceSettings.profile,
        (level: number) => setVoiceLevel(level)
      );
      
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      setTimeout(() => setShowSpeakingOverlay(false), 500);
    } catch (error) {
      console.error('Manual voice synthesis failed:', error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      setShowSpeakingOverlay(false);
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
          const newWidth = Math.max(300, e.clientX - window.position.x);
          const newHeight = Math.max(400, e.clientY - window.position.y);
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
    const updatedAgent = {
      ...agent,
      voiceSettings: newVoiceSettings
    };
    updateAgent(updatedAgent);
  };

  const handleSpeakMessage = async (text: string) => {
    try {
      if (agent.voiceSettings?.profile) {
        setIsSpeaking(true);
        setShowSpeakingOverlay(true);
        
        await voiceService.speakWithLipSync(
          text, 
          agent.voiceSettings.profile,
          (level: number) => setVoiceLevel(level)
        );
        
        setIsSpeaking(false);
        setTimeout(() => setShowSpeakingOverlay(false), 500);
      }
    } catch (error) {
      console.error('Voice synthesis failed:', error);
      setIsSpeaking(false);
      setShowSpeakingOverlay(false);
    }
  };

  const handleInternetToggle = (enabled: boolean) => {
    setInternetEnabled(enabled);
  };

  const handleAutoSearchToggle = (enabled: boolean) => {
    setAutoSearch(enabled);
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
              mood={agent.mood || 'neutral'}
              isSpeaking={isLoading}
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
        zIndex: zIndex
      }}
      onClick={handleWindowClick}
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
              mood={agent.mood || 'neutral'}
              isSpeaking={isSpeaking || isLoading}
            />
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.mood}</p>
            {/* Global voice indicator in header */}
            {agent.voiceSettings?.enabled && isSpeaking && (
              <VoiceVisualization
                isActive={true}
                variant="embedded"
                className="mt-1"
              />
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[2500]">
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <VoiceControls
            voiceSettings={agent.voiceSettings}
            onVoiceSettingsChange={handleVoiceSettingsChange}
            onSpeak={handleSpeakMessage}
            className="mr-2"
          />
          
          <InternetControls
            agentId={agent.id}
            windowId={window.id}
            internetEnabled={internetEnabled}
            autoSearch={autoSearch}
            onInternetToggle={handleInternetToggle}
            onAutoSearchToggle={handleAutoSearchToggle}
          />
          
          <DiscordControls
            agent={agent}
            onAgentUpdate={updateAgent}
            className="mr-2"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestAPI}
            disabled={isLoading}
            className="text-xs"
            title="Test API Connection"
          >
            {isTestMode ? 'Testing...' : 'Test'}
          </Button>
          
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
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border'
              }`}
              style={{
                backgroundColor: msg.sender === 'ai' ? `${agent.color}20` : undefined,
                borderColor: msg.sender === 'ai' ? agent.color : undefined
              }}
            >
              {/* Voice visualization for AI messages */}
              {msg.sender === 'ai' && agent.voiceSettings?.enabled && (
                <VoiceVisualization
                  isActive={isSpeaking && speakingMessageId === msg.id}
                  variant="floating"
                />
              )}
              
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
                
                <div className="flex items-center gap-2">
                  {/* Manual speak button for AI messages */}
                  {msg.sender === 'ai' && agent.voiceSettings?.enabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManualSpeak(msg)}
                      disabled={isSpeaking}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                      title="Speak this message"
                    >
                      <SpeakerHigh size={12} />
                    </Button>
                  )}
                  
                  {/* Inline voice indicator for currently speaking message */}
                  {msg.sender === 'ai' && agent.voiceSettings?.enabled && isSpeaking && speakingMessageId === msg.id && (
                    <VoiceVisualization
                      isActive={true}
                      variant="inline"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2 rounded-lg border border-border relative"
              style={{
                backgroundColor: `${agent.color}20`,
                borderColor: agent.color
              }}
            >
              {/* Voice visualization for loading */}
              {agent.voiceSettings?.enabled && (
                <VoiceVisualization
                  isActive={false}
                  variant="floating"
                />
              )}
              
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                
                {/* Show thinking indicator with voice prep */}
                {agent.voiceSettings?.enabled && (
                  <VoiceVisualization
                    isActive={false}
                    variant="inline"
                  />
                )}
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
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsResizing(true);
        }}
      >
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-muted-foreground/50" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/30" />
      </div>
      
      {/* Speaking Overlay */}
      <SpeakingOverlay
        agent={agent}
        isVisible={showSpeakingOverlay}
        onClose={() => setShowSpeakingOverlay(false)}
        voiceLevel={voiceLevel}
      />
    </Card>
  );
}
import { useState, useRef, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Minus, Send, Settings, SpeakerHigh, Image as ImageIcon, Stop } from '@phosphor-icons/react';
import { AIAgent, ChatMessage, ChatWindow as ChatWindowType } from '@/lib/types';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useAgents } from '@/hooks/use-agents';
import { Avatar3D } from './Avatar3D';
import { VoiceControls } from './VoiceControls';
import { InternetControls } from './InternetControls';
import { DiscordControls } from './DiscordControls';
import { ImageControls } from './ImageControls';
import { CanvasDrawing } from './CanvasDrawing';
import { ImageViewer } from './ImageViewer';
import { SpeakingOverlay } from './SpeakingOverlay';
import { VoiceVisualization } from './VoiceVisualization';
import { ChatWindowSearch } from './ChatWindowSearch';
import { voiceService, VOICE_PROFILES, VoiceSettings } from '@/lib/voice-service';
import { discordService } from '@/lib/discord-service';
import { ImageService, ImageSettings, defaultImageSettings } from '@/lib/image-service';
import { createEnhancedChatPrompt, createBasicChatPrompt, cleanUserMessage, getCapabilityExplanation } from '@/lib/chat-utils';
import { windowManager } from '@/lib/window-manager';
import { toast } from 'sonner';

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
  const [imageEnabled, setImageEnabled] = useState(agent.imageSettings?.enabled ?? false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
    style: string;
  }>>([]);
  
  // Keep current image settings in local state to avoid timing issues
  const [currentImageSettings, setCurrentImageSettings] = useState<ImageSettings>(
    agent.imageSettings || defaultImageSettings
  );
  
  // Update internet settings when agent changes
  useEffect(() => {
    setInternetEnabled(agent.internetSettings?.enabled ?? false);
    setAutoSearch(agent.internetSettings?.autoSearch ?? false);
  }, [agent.internetSettings]);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { addMessage, getAgentHistory } = useChatHistory();
  const { updateAgent } = useAgents();
  const messages = getAgentHistory(agent.id);
  
  // Track if welcome message has been shown for this agent
  const [welcomeShown, setWelcomeShown] = useKV(`nexus-welcome-shown-${agent.id}`, false);

  // Handle message selection from search
  const handleMessageSelect = (messageIndex: number) => {
    if (!messagesRef.current) return;
    
    const messageElements = messagesRef.current.querySelectorAll('[data-message-index]');
    const targetElement = messageElements[messageIndex] as HTMLElement;
    
    if (targetElement) {
      // Scroll to the message
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the message briefly
      targetElement.style.backgroundColor = 'var(--accent)';
      targetElement.style.transition = 'background-color 0.3s ease';
      
      setTimeout(() => {
        targetElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  // Add welcome message for new chats to introduce image generation
  useEffect(() => {
    // Only show welcome message for truly new agents (no history and haven't shown welcome)
    if (messages.length === 0 && !welcomeShown) {
      const welcomeMessage = currentImageSettings?.enabled 
        ? `Hello! I'm ${agent.name}. I'm ready to chat with you!

🎨 **Artistic Visualization Available!** 
I can create artistic representations for you using canvas-based algorithms. Just ask me to "draw something" or "create an image of..." and I'll generate visual artwork using the style settings in the image controls above (📷 icon).

**Note:** I create artistic visualizations using advanced canvas rendering rather than traditional AI image generation, which isn't available in this environment.

You can customize the art style (realistic, cyberpunk, artistic, etc.) and quality settings in the image controls menu.

What would you like to talk about or create today?`
        : `Hello! I'm ${agent.name}. I'm ready to chat with you!

💡 **Tip:** You can enable artistic visualization in this chat window by clicking the image icon (📷) in the controls above. Once enabled, I can create visual artwork for you!

What would you like to talk about today?`;

      // Add welcome message and mark as shown
      addMessage(agent.id, {
        content: welcomeMessage,
        sender: 'ai',
        agentId: agent.id
      });
      
      setWelcomeShown(true);
    }
  }, [messages.length, welcomeShown, agent.id, agent.name, currentImageSettings?.enabled]);

  // Add keyboard shortcut for stopping voice
  useEffect(() => {
    // Only add event listeners in browser environment with proper window object
    if (typeof window === 'undefined' || !window.addEventListener) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key stops voice synthesis
      if (e.key === 'Escape' && isSpeaking) {
        e.preventDefault();
        handleStopSpeaking();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isSpeaking]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup function to stop any ongoing operations when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Stop any ongoing voice synthesis
      if (isSpeaking) {
        try {
          voiceService.stop();
        } catch (error) {
          console.error('Error stopping voice synthesis:', error);
        }
        setIsSpeaking(false);
        setShowSpeakingOverlay(false);
        setSpeakingMessageId(null);
      }
      // Stop any image generation
      if (isGeneratingImage) {
        setIsGeneratingImage(false);
      }
      // Reset loading states
      setIsLoading(false);
    };
  }, [isSpeaking, isGeneratingImage]);

  // Function to force stop all operations
  const forceStopAllOperations = () => {
    console.log('Emergency stop activated for window:', window.id);
    
    // Cancel any ongoing API requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop voice synthesis immediately
    if (isSpeaking) {
      console.log('Stopping voice synthesis');
      try {
        voiceService.stop();
      } catch (error) {
        console.error('Error stopping voice synthesis on cleanup:', error);
      }
      setIsSpeaking(false);
      setShowSpeakingOverlay(false);
      setSpeakingMessageId(null);
      setVoiceLevel(0);
    }
    
    // Stop image generation
    if (isGeneratingImage) {
      setIsGeneratingImage(false);
    }
    
    // Reset loading states
    setIsLoading(false);
    setIsTestMode(false);
    
    // Show notification to user
    toast.warning(`Emergency stop activated for ${agent.name}`);
    
    console.log('Emergency stop completed for window:', window.id);
  };

  // Register force stop with parent component
  useEffect(() => {
    // Register this window's stop handler
    windowManager.registerStopHandler(window.id, forceStopAllOperations);
    
    // Cleanup on unmount
    return () => {
      windowManager.unregisterStopHandler(window.id);
    };
  }, [window.id]);

  const handleTestAPI = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setIsTestMode(true);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      console.log('Testing basic API connectivity...');
      
      if (typeof spark === 'undefined') {
        throw new Error('Spark API is not available');
      }
      
      const testPrompt = spark.llmPrompt`Hello! This is a simple test message. Please respond with "API test successful".`;
      const response = await spark.llm(testPrompt, selectedModel);
      
      // Check if request was aborted after completion  
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Test request was aborted');
        return;
      }
      
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
      abortControllerRef.current = null;
    }
  };

  // Update local state when agent settings change
  useEffect(() => {
    if (agent.imageSettings) {
      setCurrentImageSettings(agent.imageSettings);
      setImageEnabled(agent.imageSettings.enabled);
    }
  }, [agent.imageSettings]);

  const handleImageSettingsChange = (newSettings: ImageSettings) => {
    console.log('Image settings changing from:', currentImageSettings);
    console.log('Image settings changing to:', newSettings);
    
    // Update both local state and agent
    setCurrentImageSettings(newSettings);
    updateAgent({
      ...agent,
      imageSettings: newSettings
    });
    setImageEnabled(newSettings.enabled);
  };

  const handleGenerateImage = async (prompt: string, customSettings?: ImageSettings) => {
    // Use custom settings if provided, otherwise use current settings
    const settingsToUse = customSettings || currentImageSettings;
    
    console.log('Generating image with settings:', settingsToUse);
    console.log('Image prompt:', prompt);
    
    if (!settingsToUse?.enabled || !settingsToUse?.imageGenEnabled || isGeneratingImage) return;

    setIsGeneratingImage(true);
    
    // Add loading message
    addMessage(agent.id, {
      content: `🎨 Generating AI image for: "${prompt}"...\n\nStyle: ${settingsToUse.imageStyle} | Quality: ${settingsToUse.quality}\n\nPlease wait while I create your image...`,
      sender: 'ai',
      agentId: agent.id
    });
    
    try {
      const imageService = ImageService.getInstance();
      const imageUrl = await imageService.generateImage(prompt, settingsToUse);
      
      if (imageUrl) {
        const newImage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          prompt,
          timestamp: Date.now(),
          style: settingsToUse.imageStyle
        };
        
        setGeneratedImages(prev => [...prev, newImage]);
        
        // Add image message to chat
        addMessage(agent.id, {
          content: `✨ I've created an artistic visualization for "${prompt}" using ${settingsToUse.imageStyle} style and ${settingsToUse.quality} quality!

🎨 **Creation Method:** Advanced canvas-based artistic rendering
🖼️ **Style:** ${settingsToUse.imageStyle}
💎 **Quality:** ${settingsToUse.quality}
📐 **Resolution:** ${settingsToUse.maxCanvasSize}px

This is a creative interpretation that captures the essence of your request. You can adjust the style and quality in the image controls (📷) above for different artistic effects, or try the interactive canvas drawing feature for custom artwork!`,
          sender: 'ai',
          agentId: agent.id,
          imageUrl,
          imagePrompt: prompt
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      addMessage(agent.id, {
        content: `❌ I encountered an issue while generating your image. Let me help you troubleshoot:

🔧 **Quick Fixes:**
1. **Check Settings**: Click the image icon (📷) above and ensure "AI Image Generation" is enabled
2. **Try Simpler Prompts**: Use descriptive but simple requests like "a cat" or "sunset over ocean"
3. **Different Style**: Try changing the art style (realistic, cyberpunk, artistic, etc.)

🎨 **Alternative Options:**
- Use the interactive **Canvas Drawing** feature for custom artwork
- Try the **Quick Generate** button in image controls for inspiration
- Experiment with different quality settings (Standard vs HD)

Would you like me to try generating a simpler version, or would you prefer to use the canvas drawing tool?`,
        sender: 'ai',
        agentId: agent.id
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCanvasImageCreate = (imageUrl: string) => {
    const newImage = {
      id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      prompt: 'Canvas drawing',
      timestamp: Date.now(),
      style: 'hand-drawn'
    };
    
    setGeneratedImages(prev => [...prev, newImage]);
    
    // Add canvas image message to chat
    addMessage(agent.id, {
      content: "I've created a canvas drawing for you!",
      sender: 'ai',
      agentId: agent.id,
      imageUrl,
      imagePrompt: 'Canvas drawing'
    });
  };

  const handleRemoveImage = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSendMessage = async () => {
    if (!message || !message.trim() || isLoading) return;

    const userMessage = cleanUserMessage(message.trim());
    setMessage('');
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Add user message
    addMessage(agent.id, {
      content: userMessage,
      sender: 'user',
      agentId: agent.id
    });

    try {
      // Check if this is an image generation request
      const imageGenerationKeywords = [
        'generate image', 'create image', 'draw', 'paint', 'visualize', 
        'show me', 'create a picture', 'make an image', 'generate a picture',
        'can you draw', 'can you create', 'can you make', 'draw me',
        'paint me', 'create art', 'make art', 'generate art', 'design',
        'illustrate', 'sketch', 'render', 'produce image', 'create visual',
        'make visual', 'generate visual', 'picture of', 'image of',
        'drawing of', 'painting of', 'illustration of', 'sketch of',
        'pic of', 'photo of', 'artwork of', 'visual of'
      ];
      
      const isImageRequest = imageGenerationKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      ) || /\b(draw|paint|create|generate|make|design|illustrate|sketch|render|visualize|produce)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:picture|image|drawing|art|visual|illustration|sketch|photo|pic)/i.test(userMessage);

      if (isImageRequest && currentImageSettings?.enabled && currentImageSettings.imageGenEnabled) {
        // Extract prompt for image generation
        let imagePrompt = userMessage;
        
        // Clean up the prompt by removing generation commands but preserve the core subject
        let cleanPrompt = (imagePrompt || '')
          .replace(/(?:generate|create|draw|paint|visualize|show me|make|design|illustrate|sketch|render|produce)\s+(?:an?\s+)?(?:image|picture|drawing|art|visual|illustration|sketch)\s+(?:of\s+)?/gi, '')
          .replace(/(?:can you\s+)?(?:please\s+)?(?:generate|create|draw|paint|make|design|illustrate|sketch|render)\s+/gi, '')
          .replace(/(?:picture|image|drawing|art|visual|illustration|sketch)\s+of\s+/gi, '')
          .trim();
        
        // If the cleaning removed too much, try a more basic approach
        if (!cleanPrompt || cleanPrompt.length < 3) {
          // Extract everything after common image generation prefixes
          const patterns = [
            /(?:draw|paint|create|generate|make|design|illustrate|sketch)\s+(?:me\s+)?(?:a\s+|an\s+)?(.*)/i,
            /(?:show me|visualize|render|produce)\s+(?:a\s+|an\s+)?(.*)/i,
            /(?:image|picture|drawing|art|illustration|sketch)\s+of\s+(.*)/i
          ];
          
          for (const pattern of patterns) {
            const match = userMessage.match(pattern);
            if (match && match[1] && match[1].trim()) {
              cleanPrompt = match[1].trim();
              break;
            }
          }
          
          // If still no good prompt, use the original message
          if (!cleanPrompt || cleanPrompt.length < 3) {
            cleanPrompt = userMessage.replace(/\b(draw|paint|create|generate|make|design|illustrate|sketch|show|visualize|render|produce|image|picture|drawing|art|illustration)\b/gi, '').trim();
          }
          
          // Final fallback
          if (!cleanPrompt || cleanPrompt.length < 3) {
            cleanPrompt = 'a beautiful artistic scene';
          }
        }
        
        console.log('Original message:', userMessage);
        console.log('Cleaned prompt for image generation:', cleanPrompt);
        
        await handleGenerateImage(cleanPrompt);
        setIsLoading(false);
        return; // Exit early as we've handled the image generation
      } else if (isImageRequest) {
        // User wants image generation but it's disabled
        addMessage(agent.id, {
          content: `🎨 I'd love to help you create visual artwork! Let me guide you through enabling artistic visualization:

**🔧 To Enable Artistic Visualization:**
1. Click the **image icon (📷)** in the window controls above
2. Toggle **"Image Generation"** to **ON**
3. Choose your preferred **style** (realistic, artistic, cartoon, cyberpunk, minimalist)
4. Select **quality** (standard or HD)
5. Then ask me again to "draw" or "create an image"

**✨ What You'll Get:**
- Advanced canvas-based artistic rendering
- High-quality visual representations
- Interactive canvas for custom drawings
- Multiple styles and quality settings

**📝 Technical Note:** I create artistic visualizations using sophisticated canvas algorithms rather than external AI image services, which aren't available in this environment. The results are still beautiful and creative!

Try asking: *"draw me a beautiful sunset"* or *"create an image of a magical forest"* once enabled!`,
          sender: 'ai',
          agentId: agent.id
        });
        setIsLoading(false);
        return;
      }

      // Check if user is asking about capabilities/limitations
      const capabilityQuestions = [
        'can you use the internet', 'do you have internet', 'internet access',
        'can you browse', 'search the web', 'access websites', 'real time',
        'can you generate images', 'can you create pictures', 'image generation',
        'can you draw', 'make images', 'create visuals', 'ai images',
        'what can you do', 'your capabilities', 'your limitations',
        'how do you work', 'what are your features'
      ];
      
      const isCapabilityQuestion = capabilityQuestions.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );
      
      if (isCapabilityQuestion) {
        const lowerMessage = userMessage.toLowerCase();
        let explanationType: 'internet' | 'images' | 'both' = 'both';
        
        if (lowerMessage.includes('internet') || lowerMessage.includes('web') || lowerMessage.includes('browse')) {
          explanationType = 'internet';
        } else if (lowerMessage.includes('image') || lowerMessage.includes('draw') || lowerMessage.includes('picture') || lowerMessage.includes('visual')) {
          explanationType = 'images';
        }
        
        addMessage(agent.id, {
          content: getCapabilityExplanation(explanationType),
          sender: 'ai',
          agentId: agent.id
        });
        setIsLoading(false);
        return;
      }

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
          agentMood: agent.mood,
          imageEnabled: agent.imageSettings?.enabled ?? false
        });
        
        console.log('Enhanced prompt created. Internet context:', promptResult.hasInternetContext);
        console.log('Internet enabled:', internetEnabled, 'Auto search:', autoSearch);
        console.log('Prompt summary:', promptResult.internetSummary);
        console.log('Final prompt (first 300 chars):', promptResult.prompt.substring(0, 300));
        
        // Create the spark prompt properly
        const finalPrompt = spark.llmPrompt`${promptResult.prompt}`;
        
        console.log('Calling spark.llm with model:', selectedModel);
        aiResponse = await spark.llm(finalPrompt, selectedModel);
        
        // Check if request was aborted after completion
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Request was aborted, skipping response processing');
          return;
        }
        
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
            
            // Check if request was aborted after completion
            if (abortControllerRef.current?.signal.aborted) {
              console.log('Request was aborted, skipping response processing');
              return;
            }
            
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
                
                // Check if request was aborted after completion
                if (abortControllerRef.current?.signal.aborted) {
                  console.log('Request was aborted, skipping response processing');
                  return;
                }
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
      abortControllerRef.current = null;
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

    // Only add event listeners in browser environment
    if (typeof document !== 'undefined' && (isDragging || isResizing)) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
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
        setSpeakingMessageId(null);
        setTimeout(() => setShowSpeakingOverlay(false), 500);
      }
    } catch (error) {
      console.error('Voice synthesis failed:', error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      setShowSpeakingOverlay(false);
    }
  };

  const handleStopSpeaking = () => {
    console.log('Manual voice stop triggered');
    try {
      voiceService.stop();
    } catch (error) {
      console.error('Error stopping voice synthesis manually:', error);
    }
    setIsSpeaking(false);
    setShowSpeakingOverlay(false);
    setSpeakingMessageId(null);
    setVoiceLevel(0);
  };

  const handleInternetToggle = (enabled: boolean) => {
    setInternetEnabled(enabled);
  };

  const handleAutoSearchToggle = (enabled: boolean) => {
    setAutoSearch(enabled);
  };

  // Handle mouse events for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdatePosition(window.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      } else if (isResizing) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          onUpdateSize(window.id, {
            width: Math.max(350, e.clientX - rect.left),
            height: Math.max(400, e.clientY - rect.top)
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    // Only add event listeners in browser environment
    if (typeof document !== 'undefined' && (isDragging || isResizing)) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, window.id, onUpdatePosition, onUpdateSize]);

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
            {/* Global voice indicator in header with stop hint */}
            {agent.voiceSettings?.enabled && isSpeaking && (
              <div className="flex items-center gap-2 mt-1">
                <VoiceVisualization
                  isActive={true}
                  variant="embedded"
                  className=""
                />
                <span className="text-xs text-muted-foreground">Press ESC to stop</span>
              </div>
            )}
          </div>
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
            onStopSpeaking={handleStopSpeaking}
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
          
          <ImageControls
            settings={currentImageSettings}
            onSettingsChange={handleImageSettingsChange}
            onGenerateImage={handleGenerateImage}
            isGenerating={isGeneratingImage}
          />
          
          {currentImageSettings?.enabled && currentImageSettings?.canvasEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCanvas(!showCanvas)}
              className={`relative ${showCanvas ? 'text-accent bg-accent/20' : 'text-muted-foreground hover:text-accent'}`}
              title="Interactive Canvas Drawing"
            >
              <ImageIcon size={16} />
              {!showCanvas && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-pulse" />
              )}
            </Button>
          )}
          
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
          
          <ChatWindowSearch
            messages={messages}
            onMessageSelect={handleMessageSelect}
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

      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto"
        style={{ height: 'calc(100% - 140px)' }}
      >
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            data-message-index={index}
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
              
              {/* Display generated image if present */}
              {msg.imageUrl && (
                <div className="mt-2">
                  <img
                    src={msg.imageUrl}
                    alt={msg.imagePrompt || 'Generated image'}
                    className="max-w-full h-auto rounded-md border border-border cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      // Open image in fullscreen
                      if (typeof window !== 'undefined') {
                        const newWindow = window.open();
                        if (newWindow && newWindow.document) {
                          newWindow.document.write(`<img src="${msg.imageUrl}" style="max-width:100%;max-height:100vh;margin:auto;display:block;" />`);
                        }
                      }
                    }}
                  />
                  {msg.imagePrompt && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{msg.imagePrompt}"
                    </p>
                  )}
                </div>
              )}
              
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

      {/* Canvas Drawing Section */}
      {showCanvas && currentImageSettings?.enabled && currentImageSettings?.canvasEnabled && (
        <div className="border-t border-border p-4">
          <CanvasDrawing
            width={Math.min(window.size.width - 32, currentImageSettings.maxCanvasSize)}
            height={200}
            onImageCreate={handleCanvasImageCreate}
          />
        </div>
      )}

      {/* Generated Images Section */}
      {generatedImages.length > 0 && (
        <div className="border-t border-border p-4 max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <ImageIcon size={16} />
            Generated Images ({generatedImages.length})
          </h4>
          <ImageViewer
            images={generatedImages}
            onRemoveImage={handleRemoveImage}
          />
        </div>
      )}

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
            disabled={!message || !message.trim() || isLoading}
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
        onClose={handleStopSpeaking}
        voiceLevel={voiceLevel}
      />
    </Card>
  );
}
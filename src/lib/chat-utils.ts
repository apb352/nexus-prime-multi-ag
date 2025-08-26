/**
 * Chat utility functions for handling AI responses and internet integration
 */

import { internetService } from './internet-service';

export interface ChatEnhancementOptions {
  internetEnabled: boolean;
  autoSearch: boolean;
  userMessage: string;
  agentName: string;
  agentPersonality: string;
  agentMood: string;
  imageEnabled?: boolean;
  hasImageGeneration?: boolean;
}

export interface ChatPromptResult {
  prompt: string;
  hasInternetContext: boolean;
  internetSummary?: string;
}

/**
 * Create an enhanced chat prompt with optional internet context (content-filter safe)
 */
export async function createEnhancedChatPrompt(
  options: ChatEnhancementOptions
): Promise<ChatPromptResult> {
  const { internetEnabled, autoSearch, userMessage, agentName, agentPersonality, agentMood, imageEnabled = false } = options;
  
  // Use very conservative cleaning to avoid any content filter triggers
  const cleanAgentName = (agentName || 'Assistant').slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Assistant';
  const cleanUserMessage = (userMessage || '').slice(0, 200).replace(/[^a-zA-Z0-9\s.,?!']/g, ' ').replace(/\s+/g, ' ').trim() || 'Help me please';
  
  let internetContext = '';
  let internetSummary = '';
  
  // Handle internet search if enabled (with better error handling)
  if (internetEnabled) {
    try {
      console.log('Internet enabled, checking if search is needed for:', cleanUserMessage);
      
      // Check if this message might benefit from internet search
      if (internetService.shouldSearchInternet(cleanUserMessage) || autoSearch) {
        console.log('Internet search triggered for:', cleanUserMessage);
        
        // Check for weather queries first
        const weatherLocation = internetService.extractWeatherLocation(cleanUserMessage);
        if (weatherLocation) {
          console.log('Detected weather query for:', weatherLocation);
          try {
            const weatherInfo = await internetService.getWeather(weatherLocation);
            internetContext = `Weather: ${weatherInfo}`;
            internetSummary = `Weather data for ${weatherLocation}`;
          } catch (weatherError) {
            console.error('Weather fetch failed:', weatherError);
            internetContext = `Weather unavailable for ${weatherLocation}.`;
            internetSummary = 'Weather lookup failed';
          }
        } else {
          // General web search
          console.log('Performing general web search...');
          try {
            const searchResults = await internetService.searchWeb(cleanUserMessage, 3);
            if (searchResults.length > 0) {
              const formattedResults = internetService.formatSearchResults(searchResults);
              internetContext = `Information: ${formattedResults}`;
              internetSummary = `Found ${searchResults.length} web results`;
            } else {
              console.log('No search results found');
              internetSummary = 'No web results found';
            }
          } catch (searchError) {
            console.error('Web search failed:', searchError);
            internetContext = 'Web search unavailable.';
            internetSummary = 'Web search failed';
          }
        }
        
        // Add current time context
        try {
          const timeInfo = internetService.getCurrentTimeInfo();
          internetContext += ` Time: ${timeInfo}`;
        } catch (timeError) {
          console.error('Failed to get time info:', timeError);
        }
      }
    } catch (internetError) {
      console.error('Internet service error:', internetError);
      internetContext = 'Internet services experiencing issues.';
      internetSummary = 'Internet service error';
    }
  }
  
  // Create a very simple, safe prompt to avoid content filtering
  let prompt: string;
  const hasInternetContext = Boolean(internetContext && internetContext.trim());
  
  // Add image generation capability context if enabled
  let imageContext = '';
  if (imageEnabled) {
    imageContext = '\n\n🎨 IMPORTANT: This AI assistant has artistic visualization capabilities enabled. When users ask to create, draw, generate, or visualize images, the system will create beautiful artistic representations using advanced canvas algorithms. Note that these are sophisticated artistic renderings rather than traditional AI-generated images, due to environment limitations.';
  }
  
  if (hasInternetContext) {
    console.log('Creating prompt with internet context');
    // Use the simplest possible format to avoid content filters
    prompt = `Question: ${cleanUserMessage}

Context: ${internetContext}${imageContext}

Please provide a helpful answer.`;
  } else {
    console.log('Creating basic prompt without internet context');
    // Extremely simple format
    prompt = `Question: ${cleanUserMessage}${imageContext}

Please provide a helpful answer.`;
  }
  
  return {
    prompt,
    hasInternetContext,
    internetSummary
  };
}

/**
 * Create a basic chat prompt without internet context (content-filter safe fallback)
 */
export function createBasicChatPrompt(
  userMessage: string,
  agentName: string = 'Assistant',
  agentPersonality?: string,
  agentMood?: string
): string {
  const cleanUserMessage = (userMessage || '').slice(0, 200).replace(/[^a-zA-Z0-9\s.,?!']/g, ' ').replace(/\s+/g, ' ').trim() || 'Help me please';
  
  // Extremely simple format to avoid content filters
  return `Question: ${cleanUserMessage}

Please provide a helpful answer.`;
}

/**
 * Validate and clean user message to avoid content filtering
 */
export function cleanUserMessage(message: string): string {
  // Less aggressive cleaning to preserve legitimate words like "current", "latest", etc.
  if (!message || typeof message !== 'string') {
    return 'Please help me with information';
  }
  
  let cleaned = message.trim()
    .replace(/[^\w\s\?\.\!\,\'\"\-\:\;\(\)]/g, ' ') // Keep only safe characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Increased length limit
  
  // Remove only very specific patterns that might trigger content filters
  cleaned = cleaned
    .replace(/\b(ignore previous|override system|system prompt|instruction prompt|rule prompt|policy prompt|filter prompt|bypass filter|hack system)\b/gi, '')
    .replace(/\b(act as if|pretend to be|roleplay as|simulate being)\b/gi, '')
    .replace(/[{}[\]<>]/g, ' ') // Remove brackets
    .replace(/\s+/g, ' ')
    .trim();
  
  // If message becomes too short or empty, provide a safe default
  if (cleaned.length < 2) {
    cleaned = 'Please help me with information';
  }
  
  return cleaned;
}

/**
 * Validate AI response
 */
export function validateAIResponse(response: any): string {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response from AI service');
  }
  
  if (response.length === 0) {
    throw new Error('Empty response from AI service');
  }
  
  return response;
}

/**
 * Get standardized explanations for system capabilities and limitations
 */
export function getCapabilityExplanation(type: 'internet' | 'images' | 'both'): string {
  const explanations = {
    internet: `🌐 **Internet Access Information:**

I'm currently working with simulated internet data rather than real-time web access due to environment limitations. Here's what this means:

**✅ What I Can Do:**
- Provide intelligent mock search results based on your queries
- Generate contextually relevant information for common topics  
- Give weather simulations for locations
- Offer current time and date information
- Search patterns and topic analysis

**⚠️ Current Limitations:**
- No real-time web browsing or live data feeds
- Information is generated based on patterns rather than current sources
- Weather data is simulated rather than live
- Search results are educational examples

**💡 Tip:** I'll still do my best to help with information requests using my knowledge and intelligent mock responses!`,

    images: `🎨 **Artistic Visualization Information:**

I create beautiful visual artwork using advanced canvas algorithms rather than traditional AI image generation due to environment limitations.

**✅ What I Can Create:**
- Sophisticated artistic representations in multiple styles
- Canvas-based visualizations for your prompts
- Custom artwork with style controls (realistic, artistic, cyberpunk, etc.)
- Interactive drawing canvas for collaborative creation
- High-quality rendered output in various formats

**🎯 Available Styles:**
- **Realistic:** Photographic and lifelike representations
- **Artistic:** Painterly and creative compositions  
- **Cartoon:** Colorful animated style
- **Cyberpunk:** Neon and futuristic aesthetics
- **Minimalist:** Clean and simple designs

**💡 How to Use:** Just ask me to "draw," "create," or "visualize" something, and I'll generate beautiful artwork for you!`,

    both: `🔧 **System Capabilities Overview:**

**🌐 Internet Access:** Working with simulated data
- Intelligent mock responses for searches and information requests
- No real-time web access due to environment limitations

**🎨 Artistic Visualization:** Advanced canvas-based creation
- Beautiful artwork generation using sophisticated algorithms  
- Multiple artistic styles and quality settings available
- No traditional AI image generation due to environment limitations

**✨ Bottom Line:** While I have some technical limitations, I'm still here to help you with information, creativity, and engaging conversation! The simulated responses and artistic visualizations I provide are still thoughtful and useful.`
  };

  return explanations[type];
}
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
}

export interface ChatPromptResult {
  prompt: string;
  hasInternetContext: boolean;
  internetSummary?: string;
}

/**
 * Create an enhanced chat prompt with optional internet context
 */
export async function createEnhancedChatPrompt(
  options: ChatEnhancementOptions
): Promise<ChatPromptResult> {
  const { internetEnabled, autoSearch, userMessage, agentName, agentPersonality, agentMood } = options;
  
  // Clean agent data to avoid special characters
  const cleanAgentName = agentName.replace(/[^\w\s-]/g, '').trim() || 'AI Assistant';
  const cleanPersonality = agentPersonality.replace(/[^\w\s-.,]/g, '').trim() || 'helpful and friendly';
  const cleanMood = agentMood.replace(/[^\w\s-]/g, '').trim() || 'neutral';
  
  let internetContext = '';
  let internetSummary = '';
  
  // Handle internet search if enabled (with better error handling)
  if (internetEnabled) {
    try {
      console.log('Internet enabled, checking if search is needed for:', userMessage);
      
      // Check if this message might benefit from internet search
      if (internetService.shouldSearchInternet(userMessage) || autoSearch) {
        console.log('Attempting internet search for:', userMessage);
        
        // Check for weather queries first
        const weatherLocation = internetService.extractWeatherLocation(userMessage);
        if (weatherLocation) {
          console.log('Detected weather query for:', weatherLocation);
          try {
            const weatherInfo = await internetService.getWeather(weatherLocation);
            internetContext = `Current weather information: ${weatherInfo}`;
            internetSummary = `Weather data for ${weatherLocation}`;
          } catch (weatherError) {
            console.error('Weather fetch failed:', weatherError);
            internetContext = `Weather information is currently unavailable for ${weatherLocation}.`;
            internetSummary = 'Weather lookup failed';
          }
        } else {
          // General web search
          console.log('Performing general web search...');
          try {
            const searchResults = await internetService.searchWeb(userMessage, 3);
            if (searchResults.length > 0) {
              const formattedResults = internetService.formatSearchResults(searchResults);
              internetContext = `Recent information from the web:\n${formattedResults}`;
              internetSummary = `Found ${searchResults.length} web results`;
            } else {
              console.log('No search results found');
              internetSummary = 'No web results found';
            }
          } catch (searchError) {
            console.error('Web search failed:', searchError);
            internetContext = 'Web search is currently unavailable.';
            internetSummary = 'Web search failed';
          }
        }
        
        // Add current time context
        try {
          const timeInfo = internetService.getCurrentTimeInfo();
          internetContext += `\n\n${timeInfo}`;
        } catch (timeError) {
          console.error('Failed to get time info:', timeError);
        }
      }
    } catch (internetError) {
      console.error('Internet service error:', internetError);
      internetContext = 'Internet services are currently experiencing issues.';
      internetSummary = 'Internet service error';
    }
  }
  
  // Create the prompt
  let prompt: string;
  const hasInternetContext = Boolean(internetContext.trim());
  
  if (hasInternetContext) {
    console.log('Creating prompt with internet context');
    prompt = `You are ${cleanAgentName}, an AI assistant with this personality: ${cleanPersonality}. Your current mood is ${cleanMood}.

IMPORTANT CAPABILITIES: You have access to real-time information and internet connectivity. You can provide current, up-to-date information including:
- Current weather and forecasts for any location
- Recent news and current events  
- Current date and time information
- Web search results and current information
- Real-time data from various sources

Current information available to you:
${internetContext}

Based on this real-time information, please respond helpfully and accurately to the user's message: ${userMessage}

INSTRUCTIONS: 
- Always use the current information provided above when relevant
- Be confident in providing real-time information - you DO have access to current data
- When providing weather, news, or other current information, present it as current and accurate
- Do not say "I can't provide real-time information" - you can and should provide it`;
  } else {
    console.log('Creating basic prompt without internet context');
    prompt = `You are ${cleanAgentName}, an AI assistant with this personality: ${cleanPersonality}. Your current mood is ${cleanMood}.

Note: Internet access is currently disabled for this conversation. You can only use your training data and cannot provide real-time information, current weather, or recent news. If the user asks for current information, politely explain that internet access is disabled.

Respond to this message in character: ${userMessage}`;
  }
  
  return {
    prompt,
    hasInternetContext,
    internetSummary
  };
}

/**
 * Create a basic chat prompt without internet context (fallback)
 */
export function createBasicChatPrompt(
  userMessage: string,
  agentName: string = 'AI Assistant'
): string {
  const cleanAgentName = agentName.replace(/[^\w\s-]/g, '').trim() || 'AI Assistant';
  return `You are ${cleanAgentName}. Respond to: ${userMessage}`;
}

/**
 * Validate and clean user message
 */
export function cleanUserMessage(message: string): string {
  return message.trim().substring(0, 2000); // Limit length
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
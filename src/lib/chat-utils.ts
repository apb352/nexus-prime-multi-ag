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
    prompt = `You are ${cleanAgentName}, a helpful AI assistant with a ${cleanPersonality} communication style and ${cleanMood} demeanor.

Here is some current information that may be relevant:
${internetContext}

The user asks: ${userMessage}

Please respond helpfully and naturally, incorporating any relevant current information.`;
  } else {
    console.log('Creating basic prompt without internet context');
    prompt = `You are ${cleanAgentName}, a helpful AI assistant with a ${cleanPersonality} communication style and ${cleanMood} demeanor.

The user asks: ${userMessage}

Please respond helpfully and naturally.`;
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
  agentName: string = 'AI Assistant',
  agentPersonality?: string,
  agentMood?: string
): string {
  const cleanAgentName = agentName.replace(/[^\w\s-]/g, '').trim() || 'AI Assistant';
  const cleanPersonality = agentPersonality?.replace(/[^\w\s-.,]/g, '').trim();
  const cleanMood = agentMood?.replace(/[^\w\s-]/g, '').trim();
  
  let prompt = `You are ${cleanAgentName}, a helpful AI assistant`;
  
  if (cleanPersonality) {
    prompt += ` with a ${cleanPersonality} communication style`;
  }
  
  if (cleanMood) {
    prompt += ` and ${cleanMood} demeanor`;
  }
  
  prompt += `.\n\nThe user asks: ${userMessage}\n\nPlease respond helpfully and naturally.`;
  
  return prompt;
}

/**
 * Validate and clean user message
 */
export function cleanUserMessage(message: string): string {
  // Clean message without removing core content but filtering problematic patterns
  let cleaned = message.trim()
    .replace(/[^\w\s\?\.\!\,\'\"\-\:\;\(\)]/g, ' ') // Keep only safe characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Reasonable length limit
  
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
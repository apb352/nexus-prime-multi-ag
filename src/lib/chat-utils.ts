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
 * Create an enhanced chat prompt with optional internet context (content-filter safe)
 */
export async function createEnhancedChatPrompt(
  options: ChatEnhancementOptions
): Promise<ChatPromptResult> {
  const { internetEnabled, autoSearch, userMessage, agentName, agentPersonality, agentMood } = options;
  
  // Clean agent data to avoid special characters that might trigger filters
  const cleanAgentName = agentName.replace(/[^\w\s-]/g, '').trim() || 'Assistant';
  const cleanPersonality = agentPersonality.replace(/[^\w\s-.,]/g, '').trim() || 'helpful';
  const cleanMood = agentMood.replace(/[^\w\s-]/g, '').trim() || 'friendly';
  
  // Clean the user message to avoid any potential triggers
  const cleanUserMessage = userMessage.replace(/[^\w\s-.,?!]/g, '').trim();
  
  let internetContext = '';
  let internetSummary = '';
  
  // Handle internet search if enabled (with better error handling)
  if (internetEnabled) {
    try {
      console.log('Internet enabled, checking if search is needed for:', cleanUserMessage);
      
      // Check if this message might benefit from internet search
      if (internetService.shouldSearchInternet(cleanUserMessage) || autoSearch) {
        console.log('Attempting internet search for:', cleanUserMessage);
        
        // Check for weather queries first
        const weatherLocation = internetService.extractWeatherLocation(cleanUserMessage);
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
            const searchResults = await internetService.searchWeb(cleanUserMessage, 3);
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
    prompt = `You are ${cleanAgentName}, a ${cleanPersonality} AI assistant with a ${cleanMood} demeanor.

Current information available:
${internetContext}

User message: ${cleanUserMessage}

Please provide a helpful response using any relevant information.`;
  } else {
    console.log('Creating basic prompt without internet context');
    prompt = `You are ${cleanAgentName}, a ${cleanPersonality} AI assistant with a ${cleanMood} demeanor.

User message: ${cleanUserMessage}

Please provide a helpful response.`;
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
  const cleanAgentName = agentName.replace(/[^\w\s-]/g, '').trim() || 'Assistant';
  const cleanPersonality = agentPersonality?.replace(/[^\w\s-.,]/g, '').trim();
  const cleanMood = agentMood?.replace(/[^\w\s-]/g, '').trim();
  const cleanUserMessage = userMessage.replace(/[^\w\s-.,?!]/g, '').trim();
  
  let prompt = `You are ${cleanAgentName}, a helpful assistant`;
  
  if (cleanPersonality) {
    prompt += ` with a ${cleanPersonality} style`;
  }
  
  if (cleanMood) {
    prompt += ` and ${cleanMood} approach`;
  }
  
  prompt += `.

User message: ${cleanUserMessage}

Please provide a helpful response.`;
  
  return prompt;
}

/**
 * Validate and clean user message to avoid content filtering
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
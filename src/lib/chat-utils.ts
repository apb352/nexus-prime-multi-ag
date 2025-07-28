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
  const cleanAgentName = (agentName || 'Assistant').replace(/[^\w\s]/g, '').trim() || 'Assistant';
  const cleanPersonality = (agentPersonality || 'helpful').replace(/[^\w\s]/g, '').trim() || 'helpful';
  const cleanMood = (agentMood || 'friendly').replace(/[^\w\s]/g, '').trim() || 'friendly';
  
  // Ultra-clean user message to avoid content filters
  const cleanUserMessage = userMessage
    .replace(/[^\w\s.,?!-]/g, ' ')
    .replace(/\b(ignore|override|system|prompt|instruction|rule|policy|filter|bypass|act as|pretend|roleplay|simulate)\b/gi, '')
    .replace(/[{}[\]<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
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
  
  // Create the prompt (more conservative to avoid content filtering)
  let prompt: string;
  const hasInternetContext = Boolean(internetContext.trim());
  
  if (hasInternetContext) {
    console.log('Creating prompt with internet context');
    prompt = `You are ${cleanAgentName}, a helpful AI assistant. Please help the user with their question using the available information.

Available information:
${internetContext}

User question: ${cleanUserMessage}

Please provide a helpful response.`;
  } else {
    console.log('Creating basic prompt without internet context');
    prompt = `You are ${cleanAgentName}, a helpful AI assistant. Please help the user with their question.

User question: ${cleanUserMessage}

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
  const cleanAgentName = (agentName || 'Assistant').replace(/[^\w\s]/g, '').trim() || 'Assistant';
  const cleanUserMessage = userMessage
    .replace(/[^\w\s.,?!-]/g, ' ')
    .replace(/\b(ignore|override|system|prompt|instruction|rule|policy|filter|bypass|act as|pretend|roleplay|simulate)\b/gi, '')
    .replace(/[{}[\]<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const prompt = `You are ${cleanAgentName}, a helpful AI assistant. Please help the user with their question.

User question: ${cleanUserMessage}

Please provide a helpful response.`;
  
  return prompt;
}

/**
 * Validate and clean user message to avoid content filtering
 */
export function cleanUserMessage(message: string): string {
  // Ultra-conservative cleaning to avoid any content filtering
  let cleaned = message.trim()
    .replace(/[^\w\s\?\.\!\,\'\"\-\:\;\(\)]/g, ' ') // Keep only safe characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500); // Shorter length limit for safety
  
  // Remove any patterns that might trigger content filters
  cleaned = cleaned
    .replace(/\b(ignore|override|system|prompt|instruction|rule|policy|filter|bypass)\b/gi, '')
    .replace(/\b(act as|pretend|roleplay|simulate|jailbreak|hack)\b/gi, '')
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
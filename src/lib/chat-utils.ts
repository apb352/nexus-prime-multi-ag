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
  
  // Use very conservative cleaning to avoid any content filter triggers
  const cleanAgentName = (agentName || 'Assistant').slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Assistant';
  const cleanUserMessage = userMessage.slice(0, 200).replace(/[^a-zA-Z0-9\s.,?!']/g, ' ').replace(/\s+/g, ' ').trim();
  
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
  const hasInternetContext = Boolean(internetContext.trim());
  
  if (hasInternetContext) {
    console.log('Creating prompt with internet context');
    // Use the simplest possible format to avoid content filters
    prompt = `Question: ${cleanUserMessage}

Context: ${internetContext}

Please provide a helpful answer.`;
  } else {
    console.log('Creating basic prompt without internet context');
    // Extremely simple format
    prompt = `Question: ${cleanUserMessage}

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
  const cleanUserMessage = userMessage.slice(0, 200).replace(/[^a-zA-Z0-9\s.,?!']/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extremely simple format to avoid content filters
  return `Question: ${cleanUserMessage}

Please provide a helpful answer.`;
}

/**
 * Validate and clean user message to avoid content filtering
 */
export function cleanUserMessage(message: string): string {
  // Less aggressive cleaning to preserve legitimate words like "current", "latest", etc.
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
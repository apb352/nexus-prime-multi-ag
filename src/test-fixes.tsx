import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createEnhancedChatPrompt, createBasicChatPrompt, cleanUserMessage } from '@/lib/chat-utils';
import { internetService } from '@/lib/internet-service';

export function TestFixes() {
  const [testMessage, setTestMessage] = useState('Hi there! How are you?');
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testBasicPrompt = async () => {
    setIsLoading(true);
    try {
      // Check if spark is available
      if (typeof spark === 'undefined' || !spark.llm || !spark.llmPrompt) {
        throw new Error('Spark API is not available');
      }
      
      // Test basic prompt creation
      const basicPrompt = createBasicChatPrompt(testMessage, 'TestBot', 'friendly', 'cheerful');
      console.log('Basic prompt:', basicPrompt);
      
      // Test with spark.llm
      const sparkPrompt = spark.llmPrompt`${basicPrompt}`;
      const response = await spark.llm(sparkPrompt, 'gpt-4o');
      
      setTestResult(`Success: ${response.substring(0, 200)}...`);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEnhancedPrompt = async () => {
    setIsLoading(true);
    try {
      // Check if spark is available
      if (typeof spark === 'undefined' || !spark.llm || !spark.llmPrompt) {
        throw new Error('Spark API is not available');
      }
      
      // Test enhanced prompt creation
      const enhancedResult = await createEnhancedChatPrompt({
        internetEnabled: false,
        autoSearch: false,
        userMessage: testMessage,
        agentName: 'TestBot',
        agentPersonality: 'helpful and friendly',
        agentMood: 'cheerful'
      });
      
      console.log('Enhanced prompt:', enhancedResult.prompt);
      
      // Test with spark.llm
      const sparkPrompt = spark.llmPrompt`${enhancedResult.prompt}`;
      const response = await spark.llm(sparkPrompt, 'gpt-4o');
      
      setTestResult(`Success: ${response.substring(0, 200)}...`);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testInternetService = async () => {
    setIsLoading(true);
    try {
      console.log('Testing internet service...');
      
      // Test weather
      const weather = await internetService.getWeather('Trevose, PA');
      console.log('Weather result:', weather);
      
      // Test president search
      const presidentResults = await internetService.searchWeb('current president', 2);
      console.log('President search results:', presidentResults);
      
      // Test general search
      const searchResults = await internetService.searchWeb('test query', 2);
      console.log('Search results:', searchResults);
      
      setTestResult(`Internet Service Working: Weather - ${weather.substring(0, 50)}... | President - ${presidentResults.length} results | Search - ${searchResults.length} results`);
    } catch (error) {
      console.error('Internet test failed:', error);
      setTestResult(`Internet Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPresidentQuestion = async () => {
    setIsLoading(true);
    try {
      // Check if spark is available
      if (typeof spark === 'undefined' || !spark.llm || !spark.llmPrompt) {
        throw new Error('Spark API is not available');
      }
      
      // Test enhanced prompt with internet enabled for president question
      const enhancedResult = await createEnhancedChatPrompt({
        internetEnabled: true,
        autoSearch: true,
        userMessage: 'who is the current president',
        agentName: 'TestBot',
        agentPersonality: 'helpful and knowledgeable',
        agentMood: 'informative'
      });
      
      console.log('President prompt:', enhancedResult.prompt);
      console.log('Has internet context:', enhancedResult.hasInternetContext);
      
      // Test with spark.llm
      const sparkPrompt = spark.llmPrompt`${enhancedResult.prompt}`;
      const response = await spark.llm(sparkPrompt, 'gpt-4o');
      
      setTestResult(`President Test Success (Internet: ${enhancedResult.hasInternetContext}): ${response.substring(0, 200)}...`);
    } catch (error) {
      console.error('President test failed:', error);
      setTestResult(`President Test Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNullErrors = async () => {
    setIsLoading(true);
    try {
      console.log('Testing null error fixes...');
      
      // Test null and undefined inputs
      const nullTests = [null, undefined, '', '   '];
      
      for (const testInput of nullTests) {
        console.log(`Testing with input: ${testInput}`);
        
        // Test cleanUserMessage
        try {
          const cleaned = cleanUserMessage(testInput as string);
          console.log(`cleanUserMessage result: "${cleaned}"`);
        } catch (e) {
          console.error(`cleanUserMessage failed with ${testInput}:`, e.message);
        }
        
        // Test createBasicChatPrompt
        try {
          const prompt = createBasicChatPrompt(testInput as string);
          console.log(`createBasicChatPrompt result: "${prompt.substring(0, 50)}..."`);
        } catch (e) {
          console.error(`createBasicChatPrompt failed with ${testInput}:`, e.message);
        }
        
        // Test internet service functions
        try {
          const shouldSearch = internetService.shouldSearchInternet(testInput as string);
          console.log(`shouldSearchInternet result: ${shouldSearch}`);
        } catch (e) {
          console.error(`shouldSearchInternet failed with ${testInput}:`, e.message);
        }
        
        try {
          const weatherLocation = internetService.extractWeatherLocation(testInput as string);
          console.log(`extractWeatherLocation result: ${weatherLocation}`);
        } catch (e) {
          console.error(`extractWeatherLocation failed with ${testInput}:`, e.message);
        }
      }
      
      setTestResult('Null error testing completed - check console for details');
    } catch (error) {
      console.error('Null test failed:', error);
      setTestResult(`Null Test Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-96 m-4">
      <CardHeader>
        <CardTitle>Test Chat Fixes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Test message"
        />
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testBasicPrompt}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Basic
          </Button>
          <Button 
            onClick={testEnhancedPrompt}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Enhanced
          </Button>
          <Button 
            onClick={testInternetService}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Internet
          </Button>
          <Button 
            onClick={testPresidentQuestion}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test President
          </Button>
          <Button 
            onClick={testNullErrors}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Null Fixes
          </Button>
        </div>
        
        {testResult && (
          <div className="p-2 bg-muted rounded text-sm max-h-32 overflow-y-auto">
            {testResult}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
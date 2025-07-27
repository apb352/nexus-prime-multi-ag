import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SparkTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testSpark = async () => {
    setIsLoading(true);
    setTestResult('Testing...');

    try {
      // Test 1: Check if spark global exists
      if (typeof spark === 'undefined') {
        setTestResult('❌ spark global is undefined');
        return;
      }

      setTestResult('✅ spark global exists');

      // Test 2: Check if spark methods exist
      if (!spark.llm) {
        setTestResult('❌ spark.llm method is missing');
        return;
      }

      if (!spark.llmPrompt) {
        setTestResult('❌ spark.llmPrompt method is missing');
        return;
      }

      setTestResult('✅ spark methods exist');

      // Test 3: Try creating a simple prompt
      console.log('Testing prompt creation...');
      const prompt = spark.llmPrompt`Say hello world`;
      setTestResult('✅ prompt created successfully');

      // Test 4: Try a simple LLM call
      console.log('Testing LLM call...');
      const response = await spark.llm(prompt, 'gpt-4o');
      
      if (!response || typeof response !== 'string') {
        setTestResult('❌ Invalid response from LLM');
        return;
      }
      
      setTestResult(`✅ LLM call successful: ${response.substring(0, 100)}...`);
      
      // Test 5: Test with parameters in prompt
      console.log('Testing parameterized prompt...');
      const name = 'Tester';
      const paramPrompt = spark.llmPrompt`Hello, my name is ${name}. Please greet me.`;
      const paramResponse = await spark.llm(paramPrompt, 'gpt-4o');
      
      if (!paramResponse || typeof paramResponse !== 'string') {
        setTestResult('❌ Invalid response from parameterized prompt');
        return;
      }
      
      setTestResult(`✅ All tests passed! Last response: ${paramResponse.substring(0, 150)}...`);

    } catch (error) {
      console.error('Spark test error:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.stack) {
          console.error('Error stack:', error.stack);
        }
      }
      
      setTestResult(`❌ Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed top-4 right-4 p-4 w-80 bg-card/95 backdrop-blur-md border z-[9999]">
      <h3 className="text-lg font-semibold mb-2">Spark API Test</h3>
      <Button onClick={testSpark} disabled={isLoading} className="w-full mb-2">
        {isLoading ? 'Testing...' : 'Test Spark API'}
      </Button>
      <div className="text-sm break-words">
        {testResult}
      </div>
    </Card>
  );
}
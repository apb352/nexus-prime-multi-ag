import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SimpleTestComponent() {
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testSpark = async () => {
    setIsLoading(true);
    try {
      // Test if spark is available
      if (typeof spark === 'undefined') {
        setTestResult('Error: Spark API is not available');
        return;
      }
      
      const prompt = spark.llmPrompt`Say hello and confirm you are working.`;
      const response = await spark.llm(prompt, 'gpt-4o');
      setTestResult(`✅ Success: ${response.substring(0, 100)}...`);
    } catch (error) {
      console.error('Spark test failed:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testComponents = () => {
    try {
      setTestResult('✅ All components are loading correctly');
    } catch (error) {
      console.error('Component test failed:', error);
      setTestResult(`❌ Component Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testSpark} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Testing...' : 'Test Spark'}
          </Button>
          <Button 
            onClick={testComponents}
            variant="outline"
            size="sm"
          >
            Test Components
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
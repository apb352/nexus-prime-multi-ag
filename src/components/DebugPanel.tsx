import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const checkAPIStatus = async () => {
    setIsChecking(true);
    let info = 'Debug Information:\n\n';
    
    try {
      // Check if spark is available
      info += `1. Spark Global Object: ${typeof spark !== 'undefined' ? 'Available' : 'NOT AVAILABLE'}\n`;
      
      if (typeof spark !== 'undefined') {
        info += `   - spark.llm: ${typeof spark.llm === 'function' ? 'Available' : 'NOT AVAILABLE'}\n`;
        info += `   - spark.llmPrompt: ${typeof spark.llmPrompt === 'function' ? 'Available' : 'NOT AVAILABLE'}\n`;
        info += `   - spark.kv: ${typeof spark.kv === 'object' ? 'Available' : 'NOT AVAILABLE'}\n`;
        info += `   - spark.user: ${typeof spark.user === 'function' ? 'Available' : 'NOT AVAILABLE'}\n`;
        
        // Test basic API call
        try {
          info += '\n2. Testing basic API call...\n';
          const testPrompt = spark.llmPrompt`Say "Hello World"`;
          const response = await spark.llm(testPrompt, 'gpt-4o');
          info += `   ✓ Success: ${response.substring(0, 50)}...\n`;
        } catch (apiError) {
          info += `   ✗ API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}\n`;
        }
      }
      
      // Check environment
      info += '\n3. Environment:\n';
      info += `   - User Agent: ${navigator.userAgent.substring(0, 50)}...\n`;
      info += `   - Location: ${window.location.href}\n`;
      info += `   - Protocol: ${window.location.protocol}\n`;
      
    } catch (error) {
      info += `\nError during debug check: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
    }
    
    setDebugInfo(info);
    setIsChecking(false);
  };

  return (
    <Card className="fixed bottom-4 left-4 w-96 p-4 bg-card/95 backdrop-blur-md border-2 border-primary/50 z-[9999]">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Debug Panel</h3>
        <Button 
          onClick={checkAPIStatus} 
          disabled={isChecking}
          size="sm"
          className="w-full"
        >
          {isChecking ? 'Checking...' : 'Check API Status'}
        </Button>
        {debugInfo && (
          <Textarea
            value={debugInfo}
            readOnly
            className="text-xs font-mono h-48 resize-none"
          />
        )}
      </div>
    </Card>
  );
}
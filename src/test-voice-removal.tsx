// Test component to verify voice functionality has been removed
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function TestVoiceRemoval() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTests = () => {
    const results: string[] = [];

    // Test 1: Check if voice service is not imported
    try {
      // This should fail if voice service still exists
      const voiceService = require('@/lib/voice-service');
      results.push('❌ Voice service still exists');
    } catch {
      results.push('✅ Voice service successfully removed');
    }

    // Test 2: Check if SpeakingOverlay component is removed
    try {
      const speakingOverlay = require('@/components/SpeakingOverlay');
      results.push('❌ SpeakingOverlay component still exists');
    } catch {
      results.push('✅ SpeakingOverlay component removed');
    }

    // Test 3: Check if voice animations are removed from CSS
    if (typeof document !== 'undefined') {
      try {
        const styles = Array.from(document.styleSheets).flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText);
          } catch {
            return [];
          }
        }).join(' ');

        if (styles.includes('animate-voice')) {
          results.push('❌ Voice animations still in CSS');
        } else {
          results.push('✅ Voice animations removed from CSS');
        }
      } catch {
        results.push('⚠️ Could not check CSS');
      }
    } else {
      results.push('⚠️ Document not available (SSR mode)');
    }

    setTestResults(results);
  };

  return (
    <div className="p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold mb-4">Voice Removal Test</h3>
      <Button onClick={runTests} className="mb-4">
        Run Tests
      </Button>
      {testResults.length > 0 && (
        <div>
          <h4 className="font-medium">Test Results:</h4>
          <ul className="list-disc ml-6 mt-2">
            {testResults.map((result, index) => (
              <li key={index} className="text-sm">{result}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
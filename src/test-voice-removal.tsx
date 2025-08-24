// Test component to verify voice functionality has been removed
import { Button } from '@/compone
import { Button } from '@/components/ui/button';

    const results: string[] = [];
    // Test 1: Check if voice service is not imported

      results.push('❌ Voic
    const results: string[] = [];

    // Test 1: Check if voice service is not imported
    try {
      // This should fail if voice service still exists
      const voiceService = require('@/lib/voice-service');
      results.push('❌ Voice service still exists');
    } catch {
      results.push('✅ Voice service successfully removed');
    t

      results.push('✅ SpeakingOverlay component removed')

      const voiceLevelIndicator = require('@/components/VoiceLevel
    } catch {
    }
    // Test 3: Check if voice animations are removed fro
     

      }

      results.push('❌ Voice animations still in CSS');
      results

  };

      <h3
      <Button onClick={runTests} className="mb-4">
      </Button>
      {testRe
          <h4 className="font-medium">Test Results:</h4>
     

         
        </div>
    </div>
}




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

    setTestResults(results);

























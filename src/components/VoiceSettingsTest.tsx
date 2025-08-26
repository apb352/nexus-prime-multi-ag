import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceControls } from './VoiceControls';
import { VOICE_PROFILES, VoiceSettings } from '@/lib/voice-service';

export function VoiceSettingsTest() {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: true,
    autoSpeak: false,
    profile: VOICE_PROFILES.analytical
  });

  useEffect(() => {
    console.log('VoiceSettingsTest: Settings state updated:', voiceSettings);
  }, [voiceSettings]);

  const handleVoiceSettingsChange = (newSettings: VoiceSettings) => {
    console.log('Test component received settings change:', newSettings);
    console.log('Previous settings:', voiceSettings);
    setVoiceSettings(newSettings);
    console.log('Settings updated in test component');
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-card p-4 rounded-lg border max-w-md">
      <h3 className="text-sm font-medium mb-3">Voice Settings Test</h3>
      
      <div className="space-y-2 text-xs">
        <div>Enabled: {voiceSettings.enabled ? 'Yes' : 'No'}</div>
        <div>Auto-speak: {voiceSettings.autoSpeak ? 'Yes' : 'No'}</div>
        <div>Profile: {voiceSettings.profile?.name || 'None'}</div>
        <div>Pitch: {voiceSettings.profile?.pitch || 1}</div>
        <div>Rate: {voiceSettings.profile?.rate || 1}</div>
        <div>Volume: {voiceSettings.profile?.volume || 1}</div>
      </div>
      
      <div className="mt-3">
        <VoiceControls
          voiceSettings={voiceSettings}
          onVoiceSettingsChange={handleVoiceSettingsChange}
          className="border rounded p-2"
        />
      </div>
      
      <div className="mt-3 p-2 border rounded">
        <h4 className="text-xs font-medium mb-2">Direct Test Controls</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={voiceSettings.enabled}
              onChange={(e) => {
                console.log('Direct checkbox changed:', e.target.checked);
                handleVoiceSettingsChange({
                  ...voiceSettings,
                  enabled: e.target.checked
                });
              }}
            />
            Voice Enabled (Direct)
          </label>
          
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={voiceSettings.autoSpeak}
              onChange={(e) => {
                console.log('Direct auto-speak checkbox changed:', e.target.checked);
                handleVoiceSettingsChange({
                  ...voiceSettings,
                  autoSpeak: e.target.checked
                });
              }}
            />
            Auto-speak (Direct)
          </label>
        </div>
      </div>
    </div>
  );
}
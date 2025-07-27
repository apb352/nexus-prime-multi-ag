import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SpeakerHigh, SpeakerX, Gear, Play, Stop } from '@phosphor-icons/react';
import { VoiceProfile, VoiceSettings, voiceService, VOICE_PROFILES } from '@/lib/voice-service';

interface VoiceControlsProps {
  voiceSettings?: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  onSpeak?: (text: string) => void;
  className?: string;
}

export function VoiceControls({ 
  voiceSettings, 
  onVoiceSettingsChange, 
  onSpeak,
  className = '' 
}: VoiceControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testText] = useState("Hello! This is how I sound with the current voice settings.");

  // Early return if voiceSettings is not provided
  if (!voiceSettings) {
    return null;
  }

  useEffect(() => {
    voiceService.ensureInitialized();
  }, []);

  const handleEnabledChange = (enabled: boolean) => {
    if (!voiceSettings) return;
    onVoiceSettingsChange({
      ...voiceSettings,
      enabled
    });
  };

  const handleAutoSpeakChange = (autoSpeak: boolean) => {
    if (!voiceSettings) return;
    onVoiceSettingsChange({
      ...voiceSettings,
      autoSpeak
    });
  };

  const handleProfileChange = (profileKey: string) => {
    if (!voiceSettings) return;
    const profile = VOICE_PROFILES[profileKey];
    if (profile) {
      onVoiceSettingsChange({
        ...voiceSettings,
        profile
      });
    }
  };

  const handleProfileSettingChange = (key: keyof VoiceProfile, value: number | string) => {
    if (!voiceSettings?.profile) return;
    onVoiceSettingsChange({
      ...voiceSettings,
      profile: {
        ...voiceSettings.profile,
        [key]: value
      }
    });
  };

  const handleTestVoice = async () => {
    if (!voiceSettings) return;
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      if (voiceSettings?.profile) {
        await voiceService.speak(testText, voiceSettings.profile);
      }
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak(testText);
    } else {
      handleTestVoice();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Voice enabled toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEnabledChange(!voiceSettings?.enabled)}
        className={`p-2 ${voiceSettings?.enabled ? 'text-primary' : 'text-muted-foreground'}`}
      >
        {voiceSettings?.enabled ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
      </Button>

      {/* Quick speak button */}
      {voiceSettings?.enabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="p-2"
        >
          {isSpeaking ? <Stop size={16} /> : <Play size={16} />}
        </Button>
      )}

      {/* Voice settings popover */}
      {voiceSettings?.enabled && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Gear size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Voice Settings</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestVoice}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? 'Stop' : 'Test Voice'}
                </Button>
              </div>

              <Separator />

              {/* Auto-speak toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-speak" className="text-sm">
                  Auto-speak responses
                </Label>
                <Switch
                  id="auto-speak"
                  checked={voiceSettings?.autoSpeak ?? false}
                  onCheckedChange={handleAutoSpeakChange}
                />
              </div>

              <Separator />

              {/* Voice profile selection */}
              <div className="space-y-2">
                <Label className="text-sm">Voice Profile</Label>
                <Select
                  value={Object.keys(VOICE_PROFILES).find(
                    key => VOICE_PROFILES[key].name === voiceSettings?.profile?.name
                  ) || 'analytical'}
                  onValueChange={handleProfileChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VOICE_PROFILES).map(([key, profile]) => (
                      <SelectItem key={key} value={key}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice customization */}
              <div className="space-y-4">
                <Label className="text-sm">Voice Customization</Label>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Pitch</Label>
                      <span className="text-xs text-muted-foreground">
                        {voiceSettings?.profile?.pitch?.toFixed(1) ?? '1.0'}
                      </span>
                    </div>
                    <Slider
                      value={[voiceSettings?.profile?.pitch ?? 1]}
                      onValueChange={([value]) => handleProfileSettingChange('pitch', value)}
                      min={0.1}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Speed</Label>
                      <span className="text-xs text-muted-foreground">
                        {voiceSettings?.profile?.rate?.toFixed(1) ?? '1.0'}
                      </span>
                    </div>
                    <Slider
                      value={[voiceSettings?.profile?.rate ?? 1]}
                      onValueChange={([value]) => handleProfileSettingChange('rate', value)}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Volume</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((voiceSettings?.profile?.volume ?? 1) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[voiceSettings?.profile?.volume ?? 1]}
                      onValueChange={([value]) => handleProfileSettingChange('volume', value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
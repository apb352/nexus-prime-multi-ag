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
  onStopSpeaking?: () => void;
  className?: string;
}

export function VoiceControls({ 
  voiceSettings, 
  onVoiceSettingsChange, 
  onSpeak,
  onStopSpeaking,
  className = '' 
}: VoiceControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testText] = useState("Hello! This is how I sound with the current voice settings.");

  // Provide default voice settings if not provided
  const currentVoiceSettings = voiceSettings || {
    enabled: false,
    autoSpeak: false,
    profile: VOICE_PROFILES.analytical
  };

  // Update state based on voice service status
  useEffect(() => {
    const checkSpeakingStatus = () => {
      try {
        const isCurrentlySpeaking = voiceService.isSpeaking();
        if (isCurrentlySpeaking !== isSpeaking) {
          setIsSpeaking(isCurrentlySpeaking);
        }
      } catch (error) {
        console.error('Error checking speaking status:', error);
        setIsSpeaking(false);
      }
    };
    
    // Check every 100ms
    const interval = setInterval(checkSpeakingStatus, 100);
    
    return () => clearInterval(interval);
  }, [isSpeaking]);

  useEffect(() => {
    try {
      voiceService.ensureInitialized();
    } catch (error) {
      console.error('Error initializing voice service:', error);
    }
  }, []);

  const handleEnabledChange = (enabled: boolean) => {
    const newSettings = {
      ...currentVoiceSettings,
      enabled
    };
    onVoiceSettingsChange(newSettings);
  };

  const handleAutoSpeakChange = (autoSpeak: boolean) => {
    const newSettings = {
      ...currentVoiceSettings,
      autoSpeak
    };
    onVoiceSettingsChange(newSettings);
  };

  const handleProfileChange = (profileKey: string) => {
    const profile = VOICE_PROFILES[profileKey];
    if (profile) {
      const newSettings = {
        ...currentVoiceSettings,
        profile
      };
      onVoiceSettingsChange(newSettings);
    }
  };

  const handleProfileSettingChange = (key: keyof VoiceProfile, value: number | string) => {
    if (!currentVoiceSettings.profile) return;
    const newSettings = {
      ...currentVoiceSettings,
      profile: {
        ...currentVoiceSettings.profile,
        [key]: value
      }
    };
    onVoiceSettingsChange(newSettings);
  };

  const handleTestVoice = async () => {
    if (isSpeaking) {
      try {
        voiceService.stop();
      } catch (error) {
        console.error('Error stopping voice in test:', error);
      }
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      if (currentVoiceSettings.profile) {
        await voiceService.speak(testText, currentVoiceSettings.profile);
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

  const handleQuickStop = () => {
    if (isSpeaking) {
      try {
        voiceService.stop();
      } catch (error) {
        console.error('Error during quick stop:', error);
      }
      setIsSpeaking(false);
      if (onStopSpeaking) {
        onStopSpeaking();
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Voice enabled toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEnabledChange(!currentVoiceSettings.enabled)}
        className={`p-2 ${currentVoiceSettings.enabled ? 'text-primary' : 'text-muted-foreground'}`}
        title={currentVoiceSettings.enabled ? "Disable voice synthesis" : "Enable voice synthesis"}
      >
        {currentVoiceSettings.enabled ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
      </Button>

      {/* Quick speak button */}
      {currentVoiceSettings.enabled && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeak}
            disabled={isSpeaking}
            className="p-2"
            title={isSpeaking ? "Stop voice playback" : "Test voice with sample text"}
          >
            {isSpeaking ? <Stop size={16} /> : <Play size={16} />}
          </Button>

          {/* Quick stop button when speaking */}
          {isSpeaking && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleQuickStop}
              className="p-2 text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
              title="Stop Speaking"
            >
              <Stop size={16} />
            </Button>
          )}
        </>
      )}

      {/* Voice settings popover */}
      {currentVoiceSettings.enabled && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-2 ${currentVoiceSettings.enabled ? 'text-primary hover:text-primary' : 'text-muted-foreground'}`}
              title="Voice settings and configuration"
            >
              <Gear size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-4 voice-settings-popover !z-[2500]" 
            align="end" 
            side="bottom" 
            sideOffset={5}
            avoidCollisions={true}
            collisionPadding={20}
            style={{ zIndex: 2500 }}
          >
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
                  checked={currentVoiceSettings.autoSpeak ?? false}
                  onCheckedChange={handleAutoSpeakChange}
                />
              </div>

              <Separator />

              {/* Voice profile selection */}
              <div className="space-y-2">
                <Label className="text-sm">Voice Profile</Label>
                <Select
                  value={Object.keys(VOICE_PROFILES).find(
                    key => VOICE_PROFILES[key].name === currentVoiceSettings.profile?.name
                  ) || 'analytical'}
                  onValueChange={handleProfileChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[2500]">
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
                        {currentVoiceSettings.profile?.pitch?.toFixed(1) ?? '1.0'}
                      </span>
                    </div>
                    <Slider
                      value={[currentVoiceSettings.profile?.pitch ?? 1]}
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
                        {currentVoiceSettings.profile?.rate?.toFixed(1) ?? '1.0'}
                      </span>
                    </div>
                    <Slider
                      value={[currentVoiceSettings.profile?.rate ?? 1]}
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
                        {Math.round((currentVoiceSettings.profile?.volume ?? 1) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[currentVoiceSettings.profile?.volume ?? 1]}
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
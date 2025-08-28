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

  // Provide default voice settings if none provided
  const currentSettings = voiceSettings || {
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
    console.log('handleEnabledChange called with:', enabled);
    console.log('Current voiceSettings:', currentSettings);
    
    const newSettings = {
      enabled,
      autoSpeak: currentSettings.autoSpeak,
      profile: currentSettings.profile
    };
    console.log('Calling onVoiceSettingsChange with:', newSettings);
    onVoiceSettingsChange(newSettings);
  };

  const handleAutoSpeakChange = (autoSpeak: boolean) => {
    console.log('handleAutoSpeakChange called with:', autoSpeak);
    console.log('Current voiceSettings:', currentSettings);
    
    const newSettings = {
      enabled: currentSettings.enabled,
      autoSpeak,
      profile: currentSettings.profile
    };
    console.log('Calling onVoiceSettingsChange with:', newSettings);
    onVoiceSettingsChange(newSettings);
  };

  const handleProfileChange = (profileKey: string) => {
    console.log('handleProfileChange called with:', profileKey);
    console.log('Current voiceSettings:', currentSettings);
    
    const profile = VOICE_PROFILES[profileKey];
    if (profile) {
      const newSettings = {
        enabled: currentSettings.enabled,
        autoSpeak: currentSettings.autoSpeak,
        profile
      };
      console.log('Calling onVoiceSettingsChange with:', newSettings);
      onVoiceSettingsChange(newSettings);
    }
  };

  const handleProfileSettingChange = (key: keyof VoiceProfile, value: number | string) => {
    console.log('handleProfileSettingChange called with:', key, value);
    console.log('Current voiceSettings:', currentSettings);
    
    if (!currentSettings.profile) {
      console.warn('No voice profile available for setting change');
      return;
    }
    
    const newSettings = {
      enabled: currentSettings.enabled,
      autoSpeak: currentSettings.autoSpeak,
      profile: {
        ...currentSettings.profile,
        [key]: value
      }
    };
    console.log('Calling onVoiceSettingsChange with:', newSettings);
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
      if (currentSettings.profile) {
        await voiceService.speak(testText, currentSettings.profile);
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
        onClick={() => handleEnabledChange(!currentSettings.enabled)}
        className={`p-2 ${currentSettings.enabled ? 'text-primary' : 'text-muted-foreground'}`}
        title={currentSettings.enabled ? "Disable voice synthesis" : "Enable voice synthesis"}
      >
        {currentSettings.enabled ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
      </Button>

      {/* Quick speak button */}
      {currentSettings.enabled && (
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
      {currentSettings.enabled && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-2 ${currentSettings.enabled ? 'text-primary hover:text-primary' : 'text-muted-foreground'}`}
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
            onPointerDownOutside={(e) => {
              console.log('Popover pointer down outside');
            }}
            onEscapeKeyDown={(e) => {
              console.log('Popover escape key down');
            }}
          >
            <div 
              className="space-y-4"
              onClick={(e) => {
                console.log('Popover content clicked');
                e.stopPropagation();
              }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Voice Settings</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestVoice}
                  disabled={isSpeaking}
                  title="Test current voice settings with sample text"
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
                  checked={currentSettings.autoSpeak}
                  onCheckedChange={handleAutoSpeakChange}
                  onClick={(e) => {
                    console.log('Switch clicked, current checked:', currentSettings.autoSpeak);
                    e.stopPropagation();
                  }}
                />
              </div>

              <Separator />

              {/* Voice profile selection */}
              <div className="space-y-2">
                <Label className="text-sm">Voice Profile</Label>
                <Select
                  value={Object.keys(VOICE_PROFILES).find(
                    key => VOICE_PROFILES[key].name === currentSettings.profile?.name
                  ) || 'analytical'}
                  onValueChange={(value) => {
                    console.log('Profile select changed to:', value);
                    handleProfileChange(value);
                  }}
                >
                  <SelectTrigger onClick={(e) => {
                    console.log('Profile select trigger clicked');
                    e.stopPropagation();
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[2500]">
                    {Object.entries(VOICE_PROFILES).map(([key, profile]) => (
                      <SelectItem 
                        key={key} 
                        value={key}
                        onClick={(e) => {
                          console.log('Profile item clicked:', key);
                          e.stopPropagation();
                        }}
                      >
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
                        {currentSettings.profile?.pitch?.toFixed(1) ?? '1.0'}
                      </span>
                    </div>
                    <Slider
                      value={[currentSettings.profile?.pitch ?? 1]}
                      onValueChange={([value]) => {
                        console.log('Pitch slider changed to:', value);
                        handleProfileSettingChange('pitch', value);
                      }}
                      min={0.1}
                      max={2}
                      step={0.1}
                      className="w-full"
                      onClick={(e) => {
                        console.log('Pitch slider clicked');
                        e.stopPropagation();
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Speed</Label>
                      <span className="text-xs text-muted-foreground">
                        {currentSettings.profile?.rate?.toFixed(1) ?? '1.0'}
                      </span>
                    </div>
                    <Slider
                      value={[currentSettings.profile?.rate ?? 1]}
                      onValueChange={([value]) => {
                        console.log('Rate slider changed to:', value);
                        handleProfileSettingChange('rate', value);
                      }}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                      onClick={(e) => {
                        console.log('Rate slider clicked');
                        e.stopPropagation();
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Volume</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((currentSettings.profile?.volume ?? 1) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[currentSettings.profile?.volume ?? 1]}
                      onValueChange={([value]) => {
                        console.log('Volume slider changed to:', value);
                        handleProfileSettingChange('volume', value);
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                      onClick={(e) => {
                        console.log('Volume slider clicked');
                        e.stopPropagation();
                      }}
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
export interface VoiceProfile {
  name: string;
  pitch: number; // 0.1 to 2
  rate: number; // 0.1 to 10
  volume: number; // 0 to 1
  lang: string;
  voiceName?: string; // Preferred voice name if available
}

export interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  profile: VoiceProfile;
}

// Predefined voice profiles for different agent personalities
export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  analytical: {
    name: 'Analytical',
    pitch: 0.8,
    rate: 1.1,
    volume: 0.8,
    lang: 'en-US',
    voiceName: 'Microsoft David - English (United States)'
  },
  creative: {
    name: 'Creative',
    pitch: 1.3,
    rate: 0.9,
    volume: 0.9,
    lang: 'en-US',
    voiceName: 'Microsoft Zira - English (United States)'
  },
  mentor: {
    name: 'Mentor',
    pitch: 0.7,
    rate: 0.8,
    volume: 0.9,
    lang: 'en-US',
    voiceName: 'Microsoft Mark - English (United States)'
  },
  explorer: {
    name: 'Explorer',
    pitch: 1.1,
    rate: 1.2,
    volume: 0.8,
    lang: 'en-US',
    voiceName: 'Microsoft Hazel - English (Great Britain)'
  },
  philosopher: {
    name: 'Philosopher',
    pitch: 0.6,
    rate: 0.7,
    volume: 0.9,
    lang: 'en-US',
    voiceName: 'Microsoft George - English (United States)'
  },
  companion: {
    name: 'Companion',
    pitch: 1.2,
    rate: 1.0,
    volume: 0.9,
    lang: 'en-US',
    voiceName: 'Microsoft Eva - English (United States)'
  }
};

export class VoiceService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private _isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synthesis = window.speechSynthesis;
      this.initializeVoices();
    }
  }

  private async initializeVoices(): Promise<void> {
    if (!this.synthesis) {
      this.isInitialized = true;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const loadVoices = () => {
        if (this.synthesis) {
          this.voices = this.synthesis.getVoices();
        }
        this.isInitialized = true;
        resolve();
      };

      if (this.synthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        // Check if addEventListener exists before using it
        if (typeof this.synthesis.addEventListener === 'function') {
          this.synthesis.addEventListener('voiceschanged', loadVoices, { once: true });
        } else {
          // Fallback: just resolve without voices
          this.isInitialized = true;
          resolve();
        }
      }
    });
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoices();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public findBestVoice(profile: VoiceProfile): SpeechSynthesisVoice | null {
    // First try to find the preferred voice by name
    if (profile.voiceName) {
      const preferredVoice = this.voices.find(voice => 
        voice.name.includes(profile.voiceName!) || 
        voice.name === profile.voiceName
      );
      if (preferredVoice) return preferredVoice;
    }

    // Fallback to finding by language and gender patterns
    const langVoices = this.voices.filter(voice => voice.lang.startsWith(profile.lang));
    
    if (langVoices.length === 0) {
      return this.voices[0] || null;
    }

    // Try to match voice characteristics based on pitch
    if (profile.pitch > 1.0) {
      // Higher pitch - prefer female voices
      const femaleVoice = langVoices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('eva') ||
        voice.name.toLowerCase().includes('hazel')
      );
      if (femaleVoice) return femaleVoice;
    } else {
      // Lower pitch - prefer male voices
      const maleVoice = langVoices.find(voice => 
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('mark') ||
        voice.name.toLowerCase().includes('george')
      );
      if (maleVoice) return maleVoice;
    }

    return langVoices[0];
  }

  public speak(text: string, profile: VoiceProfile): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !text.trim()) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      
      // Apply voice profile settings
      utterance.pitch = Math.max(0.1, Math.min(2, profile.pitch));
      utterance.rate = Math.max(0.1, Math.min(10, profile.rate));
      utterance.volume = Math.max(0, Math.min(1, profile.volume));
      utterance.lang = profile.lang;

      // Set the best matching voice
      const voice = this.findBestVoice(profile);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this._isSpeaking = true;
        console.log('Voice synthesis started');
      };

      utterance.onend = () => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        console.log('Voice synthesis ended');
        resolve();
      };
      
      utterance.onerror = (event) => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        console.error('Voice synthesis error:', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  public speakWithLipSync(
    text: string, 
    profile: VoiceProfile, 
    onVoiceLevel?: (level: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !text.trim()) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      
      // Apply voice profile settings
      utterance.pitch = Math.max(0.1, Math.min(2, profile.pitch));
      utterance.rate = Math.max(0.1, Math.min(10, profile.rate));
      utterance.volume = Math.max(0, Math.min(1, profile.volume));
      utterance.lang = profile.lang;

      // Set the best matching voice
      const voice = this.findBestVoice(profile);
      if (voice) {
        utterance.voice = voice;
      }

      // Set up audio analysis for lip sync if available
      let animationId: number | null = null;
      
      try {
        // Note: Speech synthesis output capture is limited in browsers
        // We'll simulate voice levels based on speech timing instead
        const simulateVoiceLevel = () => {
          if (!onVoiceLevel) return;
          
          // Simulate realistic voice activity based on text characteristics
          const words = text.split(/\s+/);
          const speechDuration = (words.length / (profile.rate * 2.5)) * 1000; // Approximate duration
          const startTime = Date.now();
          
          const updateLevel = () => {
            if (!this._isSpeaking) {
              if (onVoiceLevel) onVoiceLevel(0);
              return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = elapsed / speechDuration;
            
            if (progress >= 1) {
              if (onVoiceLevel) onVoiceLevel(0);
              return;
            }
            
            // Create realistic voice patterns
            const baseLevel = 0.3 + Math.random() * 0.4;
            const speechPattern = Math.sin(elapsed * 0.01) * 0.3 + 0.3;
            const microVariation = Math.sin(elapsed * 0.02) * 0.2;
            const wordBreaks = Math.sin(elapsed * 0.005) > 0.8 ? 0.1 : 1;
            
            const level = Math.max(0, Math.min(1, 
              (baseLevel + speechPattern + microVariation) * wordBreaks
            ));
            
            if (onVoiceLevel) onVoiceLevel(level);
            animationId = requestAnimationFrame(updateLevel);
          };
          
          updateLevel();
        };
        
        simulateVoiceLevel();
        
      } catch (error) {
        console.warn('Could not set up audio analysis for lip sync:', error);
        
        // Fallback: Simple simulation without Web Audio API
        if (onVoiceLevel) {
          const words = text.split(/\s+/);
          const speechDuration = (words.length / (profile.rate * 2.5)) * 1000;
          const startTime = Date.now();
          
          const simpleUpdate = () => {
            if (!this._isSpeaking) {
              if (onVoiceLevel) onVoiceLevel(0);
              return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = elapsed / speechDuration;
            
            if (progress >= 1) {
              if (onVoiceLevel) onVoiceLevel(0);
              return;
            }
            
            // Simple sine wave pattern
            const level = Math.sin(elapsed * 0.008) * 0.5 + 0.5;
            if (onVoiceLevel) onVoiceLevel(level * 0.7); // Moderate intensity
            animationId = requestAnimationFrame(simpleUpdate);
          };
          
          simpleUpdate();
        }
      }

      utterance.onstart = () => {
        this._isSpeaking = true;
        console.log('Voice synthesis with lip sync started');
      };

      utterance.onend = () => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (onVoiceLevel) {
          onVoiceLevel(0); // Reset voice level
        }
        console.log('Voice synthesis with lip sync ended');
        resolve();
      };
      
      utterance.onerror = (event) => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (onVoiceLevel) {
          onVoiceLevel(0); // Reset voice level
        }
        console.error('Voice synthesis error:', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  public stop(): void {
    console.log('Voice service stop called');
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this._isSpeaking = false;
    this.currentUtterance = null;
  }

  public pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  public resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  public isSpeaking(): boolean {
    return this._isSpeaking || (this.synthesis ? this.synthesis.speaking : false);
  }

  public isPaused(): boolean {
    return this.synthesis ? this.synthesis.paused : false;
  }
}

// Lazy-loaded voice service to avoid window access during module initialization
let voiceServiceInstance: VoiceService | null = null;

function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
}

export const voiceService = {
  get instance() {
    return getVoiceService();
  },
  
  // Delegate all methods to the instance
  async ensureInitialized() {
    try {
      return this.instance.ensureInitialized();
    } catch (error) {
      console.error('Voice service ensureInitialized error:', error);
      return Promise.resolve();
    }
  },
  
  async speak(text: string, profile: VoiceProfile) {
    try {
      return this.instance.speak(text, profile);
    } catch (error) {
      console.error('Voice service speak error:', error);
      return Promise.resolve();
    }
  },
  
  async speakWithLipSync(text: string, profile: VoiceProfile, onVoiceLevel?: (level: number) => void) {
    try {
      return this.instance.speakWithLipSync(text, profile, onVoiceLevel);
    } catch (error) {
      console.error('Voice service speakWithLipSync error:', error);
      return Promise.resolve();
    }
  },
  
  stop() {
    try {
      return this.instance.stop();
    } catch (error) {
      console.error('Voice service stop error:', error);
    }
  },
  
  pause() {
    try {
      return this.instance.pause();
    } catch (error) {
      console.error('Voice service pause error:', error);
    }
  },
  
  resume() {
    try {
      return this.instance.resume();
    } catch (error) {
      console.error('Voice service resume error:', error);
    }
  },
  
  isSpeaking() {
    try {
      return this.instance.isSpeaking();
    } catch (error) {
      console.error('Voice service isSpeaking error:', error);
      return false;
    }
  },
  
  isPaused() {
    try {
      return this.instance.isPaused();
    } catch (error) {
      console.error('Voice service isPaused error:', error);
      return false;
    }
  },
  
  getAvailableVoices() {
    try {
      return this.instance.getAvailableVoices();
    } catch (error) {
      console.error('Voice service getAvailableVoices error:', error);
      return [];
    }
  },
  
  findBestVoice(profile: VoiceProfile) {
    try {
      return this.instance.findBestVoice(profile);
    } catch (error) {
      console.error('Voice service findBestVoice error:', error);
      return null;
    }
  }
};
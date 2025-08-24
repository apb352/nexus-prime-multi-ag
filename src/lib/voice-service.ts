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
    voiceName: 'Microsoft Richard - English (United States)'
  },
  strategist: {
    name: 'Strategist',
    pitch: 0.9,
    rate: 1.0,
    volume: 0.8,
    lang: 'en-US',
    voiceName: 'Microsoft George - English (United States)'
  },
  innovator: {
    name: 'Innovator',
    pitch: 1.2,
    rate: 1.3,
    volume: 0.9,
    lang: 'en-US',
    voiceName: 'Microsoft Susan - English (United States)'
  },
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
    if (!this.voices.length) return null;

    // First, try to find by exact voice name
    if (profile.voiceName) {
      const exactMatch = this.voices.find(voice => voice.name === profile.voiceName);
      if (exactMatch) return exactMatch;
    }

    // Then try to find by language
    const langMatches = this.voices.filter(voice => voice.lang.startsWith(profile.lang.split('-')[0]));
    if (langMatches.length > 0) {
      // Prefer the first match for the specific language
      const exactLangMatch = langMatches.find(voice => voice.lang === profile.lang);
      return exactLangMatch || langMatches[0];
    }

    // Fallback to first available voice
    return this.voices[0];
  }

  public async speak(text: string, profile: VoiceProfile): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return Promise.resolve();
    }

    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        this.stop(); // Stop any current speech

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.findBestVoice(profile);

        if (voice) {
          utterance.voice = voice;
        }

        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        utterance.volume = profile.volume;
        utterance.lang = profile.lang;

        utterance.onstart = () => {
          this._isSpeaking = true;
        };

        utterance.onend = () => {
          this._isSpeaking = false;
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (event) => {
          this._isSpeaking = false;
          this.currentUtterance = null;
          console.error('Speech synthesis error:', event.error);
          resolve(); // Resolve instead of reject to prevent breaking the chain
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
      } catch (error) {
        this._isSpeaking = false;
        this.currentUtterance = null;
        console.error('Speech synthesis error:', error);
        resolve(); // Resolve instead of reject
      }
    });
  }

  public async speakWithLipSync(
    text: string, 
    profile: VoiceProfile,
    onVoiceLevel?: (level: number) => void
  ): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return Promise.resolve();
    }

    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        this.stop(); // Stop any current speech

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.findBestVoice(profile);

        if (voice) {
          utterance.voice = voice;
        }

        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        utterance.volume = profile.volume;
        utterance.lang = profile.lang;

        let intervalId: number | null = null;

        utterance.onstart = () => {
          this._isSpeaking = true;
          
          // Simulate voice level changes for lip sync
          if (onVoiceLevel) {
            intervalId = window.setInterval(() => {
              if (this._isSpeaking) {
                // Generate a random voice level between 0.3 and 1.0
                const level = 0.3 + Math.random() * 0.7;
                onVoiceLevel(level);
              }
            }, 100);
          }
        };

        utterance.onend = () => {
          this._isSpeaking = false;
          this.currentUtterance = null;
          if (intervalId) {
            clearInterval(intervalId);
          }
          if (onVoiceLevel) {
            onVoiceLevel(0);
          }
          resolve();
        };

        utterance.onerror = (event) => {
          this._isSpeaking = false;
          this.currentUtterance = null;
          if (intervalId) {
            clearInterval(intervalId);
          }
          if (onVoiceLevel) {
            onVoiceLevel(0);
          }
          console.error('Speech synthesis error:', event.error);
          resolve(); // Resolve instead of reject
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
      } catch (error) {
        this._isSpeaking = false;
        this.currentUtterance = null;
        if (onVoiceLevel) {
          onVoiceLevel(0);
        }
        console.error('Speech synthesis error:', error);
        resolve(); // Resolve instead of reject
      }
    });
  }

  public stop(): void {
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
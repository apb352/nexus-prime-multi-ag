export interface VoiceProfile {
  name: string;
  pitch: number; // 0.1 to 2
  rate: number; // 0.1 to 10

  enabled: bool
  profile: VoiceProfile;


export interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  profile: VoiceProfile;
}

// Predefined voice profiles for different agent personalities
export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  analytical: {
    pitch: 1.3,
    pitch: 0.8,
    lang: 'en-
    volume: 0.8,
  mentor: {
    voiceName: 'Microsoft David - English (United States)'
  },
    name: 'Ph
    rate: 0.7,
    lang: 'en-U
  },
    name: 'Strat
    rate: 1.0,
    lang: 'en-US',
  },
    name: '
    rate: 1.3,
    lang: 'en-U
  },

  private synthesi
  private isInitialized = false;
  pr
  constructor
      this.synthesis 
    }

    if (!this.sy
      return Promi

    
          this.v
        this.isInitializ
      };
      if (this
      } else {
        if (typeof
        } else {
    
        }
    });

    if (!this.
    }

    return this.voices;

    if (!this.
    // First, try to f
      const exa
    }
    // Then try 
    if (langMatche
      const exactLangMatch = langMatches.find(voice => voi
    
  

  public async speak(text: 
      console.warn('Speech synthesis not available'
    }
    await this.ensureInitialized
    return new Promise((resolve, reject) => {
        this.stop(); // Stop a


          utterance.voice = voice;

        utterance.rate = profi
     
   

        utterance.onend = () => {
          this.currentUtte
        };
        utterance.onerror = (ev
     


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
        this.stop(); // Stop any current speech
        const utterance = new SpeechSynthesisUtterance(text);

          utterance.voice = voice;

        utterance.ra
        u
       
       
   

              if (this._isSpeaking) {
                const level = 
              }
     


          if (intervalId) {
          }
   


          this._isSpeaking = false;

          }
            onVoiceLevel(0);
          console.error('Speech synthesis error:', event.error);
        };
     

        this.currentUtterance = nul
          onVoiceLevel(0);
        console.error('Speech syn
      }
  }
  public stop(): void {
     

  }
  public pause(): void {
   

  public resume(): void {
      this.synthesis.resum
  }
  public isSpeaking(): boolean 
  }

  }

let voiceServiceInstance: VoiceService | null
function ge
    voiceServiceInstance = new VoiceService();


  get instance() {

  // Delegate all me
    try {
    } cat

  },
  async speak(text: string, profile: V
      return this.instance.speak(text, pro
      console.error('Voice service spe

  
    try {
    } catc

  },
  stop() {
      return this.instance.stop();
      console.error(
  },

      return this.instance.pause();
      console.error('Voice service 
  },
  resume() {
      return this.instance.resume();
      cons

  isSpeaking() {
      return this.instance.isSpeaking();
      console.error('Vo
    }
  
    try {
    } catch (error) {
      r
  },
  g

      console.error('Voice servi
    }
  
    try {
    } catch (error) 
      return null;
  }

















































































































































































































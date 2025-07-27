/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Web Speech API declarations
interface SpeechSynthesisVoice {
  readonly default: boolean;
  readonly lang: string;
  readonly localService: boolean;
  readonly name: string;
  readonly voiceURI: string;
}

interface SpeechSynthesisUtterance extends EventTarget {
  lang: string;
  pitch: number;
  rate: number;
  text: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
}

interface SpeechSynthesis extends EventTarget {
  readonly paused: boolean;
  readonly pending: boolean;
  readonly speaking: boolean;
  cancel(): void;
  getVoices(): SpeechSynthesisVoice[];
  pause(): void;
  resume(): void;
  speak(utterance: SpeechSynthesisUtterance): void;
  addEventListener(type: 'voiceschanged', listener: (this: SpeechSynthesis, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
}

interface SpeechSynthesisEvent extends Event {
  readonly charIndex: number;
  readonly charLength: number;
  readonly elapsedTime: number;
  readonly name: string;
  readonly utterance: SpeechSynthesisUtterance;
}

interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
  readonly error: string;
}

declare var SpeechSynthesisUtterance: {
  prototype: SpeechSynthesisUtterance;
  new(text?: string): SpeechSynthesisUtterance;
};

interface Window {
  speechSynthesis: SpeechSynthesis;
  spark: {
    llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string;
    llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>;
    user: () => Promise<{
      avatarUrl: string;
      email: string;
      id: string;
      isOwner: boolean;
      login: string;
    }>;
    kv: {
      keys: () => Promise<string[]>;
      get: <T>(key: string) => Promise<T | undefined>;
      set: <T>(key: string, value: T) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
  };
}

declare const spark: Window['spark'];
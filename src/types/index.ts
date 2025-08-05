// Language interface
export interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

// Voice recognition states
export interface VoiceState {
  isListening: boolean;
  isProcessingVoice: boolean;
  hasAudioPermission: boolean;
}

// TTS states
export interface TTSState {
  isTtsInitialized: boolean;
  isSpeakingInput: boolean;
  isSpeakingOutput: boolean;
  availableVoices: any[];
}

// Translation states
export interface TranslationState {
  isTranslating: boolean;
  inputText: string;
  translatedText: string;
  accumulatedTranslation: string;
}

// Mirror mode states
export interface MirrorState {
  isMirrorMode: boolean;
  mirrorInputText: string;
  mirrorTranslatedText: string;
  isMirrorListening: boolean;
  isMirrorProcessingVoice: boolean;
}

// App main state
export interface AppState extends TranslationState, VoiceState, TTSState, MirrorState {
  isModelReady: boolean;
  sourceLanguage: Language;
  targetLanguage: Language;
  showMenu: boolean;
  showSourceSelector: boolean;
  showTargetSelector: boolean;
  sourceSearchQuery: string;
  targetSearchQuery: string;
  loadingMessage: string;
}
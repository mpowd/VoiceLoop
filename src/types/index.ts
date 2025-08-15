// Language interface
export interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Chat settings interface
export interface ChatSettings {
  systemPrompt: string;
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

// Chat mode states
export interface ChatState {
  isChatMode: boolean;
  chatMessages: ChatMessage[];
  isChatGenerating: boolean;
  chatSettings: ChatSettings;
  showChatSettings: boolean;
}

// App main state
export interface AppState extends TranslationState, VoiceState, TTSState, MirrorState, ChatState {
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
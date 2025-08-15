import { useState } from 'react';
import { Language, MirrorState, ChatMessage, ChatSettings } from '../types';
import { languages } from '../utils/languages';

interface AppStateHook extends MirrorState {
  // Language state
  sourceLanguage: Language;
  targetLanguage: Language;

  // UI state
  showMenu: boolean;
  showSourceSelector: boolean;
  showTargetSelector: boolean;
  sourceSearchQuery: string;
  targetSearchQuery: string;

  // Chat state
  isChatMode: boolean;
  chatMessages: ChatMessage[];
  chatSettings: ChatSettings;
  showChatSettings: boolean;

  // Actions
  setSourceLanguage: (language: Language) => void;
  setTargetLanguage: (language: Language) => void;
  swapLanguages: () => void;
  toggleMirrorMode: () => void;
  toggleChatMode: () => void;
  setShowMenu: (show: boolean) => void;
  setShowSourceSelector: (show: boolean) => void;
  setShowTargetSelector: (show: boolean) => void;
  setSourceSearchQuery: (query: string) => void;
  setTargetSearchQuery: (query: string) => void;
  setMirrorInputText: (text: string) => void;
  setMirrorTranslatedText: (text: string) => void;
  setIsMirrorListening: (listening: boolean) => void;
  setIsMirrorProcessingVoice: (processing: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearChatMessages: () => void;
  clearAllTexts: () => void;
  setChatSettings: (settings: ChatSettings) => void;
  setShowChatSettings: (show: boolean) => void;
}

export const useAppState = (): AppStateHook => {
  // Language state
  const [sourceLanguage, setSourceLanguage] = useState<Language>(languages[0]); // English
  const [targetLanguage, setTargetLanguage] = useState<Language>(languages[11]); // German

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');

  // Mirror mode state
  const [isMirrorMode, setIsMirrorMode] = useState(false);
  const [mirrorInputText, setMirrorInputText] = useState('');
  const [mirrorTranslatedText, setMirrorTranslatedText] = useState('');
  const [isMirrorListening, setIsMirrorListening] = useState(false);
  const [isMirrorProcessingVoice, setIsMirrorProcessingVoice] = useState(false);

  // Chat mode state
  const [isChatMode, setIsChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    systemPrompt: '',
  });

  // Swap languages and their texts
  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);

    // Swap mirror texts as well
    const tempMirrorText = mirrorInputText;
    setMirrorInputText(mirrorTranslatedText);
    setMirrorTranslatedText(tempMirrorText);
  };

  // Toggle mirror mode
  const toggleMirrorMode = () => {
    setIsMirrorMode(!isMirrorMode);
    // Disable chat mode when enabling mirror mode
    if (!isMirrorMode) {
      setIsChatMode(false);
    }
  };

  // Toggle chat mode
  const toggleChatMode = () => {
    setIsChatMode(!isChatMode);
    // Disable mirror mode when enabling chat mode
    if (!isChatMode) {
      setIsMirrorMode(false);
    }
  };

  // Add a chat message
  const addChatMessage = (message: ChatMessage) => {
    console.log('📝 Adding chat message:', {
      id: message.id,
      role: message.role,
      contentLength: message.content.length,
    });
    setChatMessages(prev => [...prev, message]);
  };

  // Update a specific chat message by ID (for streaming)
  const updateChatMessage = (id: string, updates: Partial<ChatMessage>) => {
    console.log('🔄 Updating chat message:', {
      id,
      contentLength: updates.content?.length,
    });
    setChatMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.id === id);
      if (messageIndex === -1) {
        console.warn('⚠️ Message not found for update:', id);
        return prev;
      }

      const newMessages = [...prev];
      newMessages[messageIndex] = { ...newMessages[messageIndex], ...updates };
      return newMessages;
    });
  };

  // Clear chat messages
  const clearChatMessages = () => {
    console.log('🗑️ Clearing all chat messages');
    setChatMessages([]);
  };

  // Clear all texts
  const clearAllTexts = () => {
    setMirrorInputText('');
    setMirrorTranslatedText('');
    setChatMessages([]);
  };

  return {
    // Language state
    sourceLanguage,
    targetLanguage,

    // UI state
    showMenu,
    showSourceSelector,
    showTargetSelector,
    sourceSearchQuery,
    targetSearchQuery,

    // Mirror state
    isMirrorMode,
    mirrorInputText,
    mirrorTranslatedText,
    isMirrorListening,
    isMirrorProcessingVoice,

    // Chat state
    isChatMode,
    chatMessages,
    chatSettings,
    showChatSettings,

    // Actions
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages,
    toggleMirrorMode,
    toggleChatMode,
    setShowMenu,
    setShowSourceSelector,
    setShowTargetSelector,
    setSourceSearchQuery,
    setTargetSearchQuery,
    setMirrorInputText,
    setMirrorTranslatedText,
    setIsMirrorListening,
    setIsMirrorProcessingVoice,
    addChatMessage,
    updateChatMessage,
    clearChatMessages,
    clearAllTexts,
    setChatSettings,
    setShowChatSettings,
  };
};

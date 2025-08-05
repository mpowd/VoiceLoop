import { useState } from 'react';
import { Language, MirrorState } from '../types';
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

  // Actions
  setSourceLanguage: (language: Language) => void;
  setTargetLanguage: (language: Language) => void;
  swapLanguages: () => void;
  toggleMirrorMode: () => void;
  setShowMenu: (show: boolean) => void;
  setShowSourceSelector: (show: boolean) => void;
  setShowTargetSelector: (show: boolean) => void;
  setSourceSearchQuery: (query: string) => void;
  setTargetSearchQuery: (query: string) => void;
  setMirrorInputText: (text: string) => void;
  setMirrorTranslatedText: (text: string) => void;
  setIsMirrorListening: (listening: boolean) => void;
  setIsMirrorProcessingVoice: (processing: boolean) => void;
  clearAllTexts: () => void;
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
  };

  // Clear all texts
  const clearAllTexts = () => {
    setMirrorInputText('');
    setMirrorTranslatedText('');
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

    // Actions
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages,
    toggleMirrorMode,
    setShowMenu,
    setShowSourceSelector,
    setShowTargetSelector,
    setSourceSearchQuery,
    setTargetSearchQuery,
    setMirrorInputText,
    setMirrorTranslatedText,
    setIsMirrorListening,
    setIsMirrorProcessingVoice,
    clearAllTexts,
  };
};

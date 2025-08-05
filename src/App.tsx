import React, { useCallback } from 'react';
import { Vibration } from 'react-native';

// Components
import LoadingScreen from './components/LoadingScreen';
import NormalMode from './components/NormalMode';
import MirrorMode from './components/MirrorMode';

// Hooks
import { useGemmaModel } from './hooks/useGemmaModel';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useTranslation } from './hooks/useTranslation';
import { useAppState } from './hooks/useAppState';

const VoiceLoopApp: React.FC = () => {
  // Initialize all hooks
  const gemmaModel = useGemmaModel();
  const appState = useAppState();

  // Translation callbacks
  const translationCallbacks = {
    onMirrorTranslationUpdate: (text: string) => {
      appState.setMirrorTranslatedText(text);
    },
    onMirrorTranslationComplete: (text: string) => {
      appState.setMirrorTranslatedText(text);
    },
    reloadModel: gemmaModel.loadGemmaModel,
  };

  const translation = useTranslation(
    gemmaModel.isModelReady,
    translationCallbacks,
  );

  // Voice recognition callbacks - properly memoized functions
  const onVoiceTextUpdate = useCallback(
    (text: string, isMirror = false) => {
      console.log('📝 Voice callback - onTextUpdate:', { text, isMirror });
      if (isMirror) {
        appState.setMirrorInputText(text);
      } else {
        translation.setInputText(text);
      }
    },
    [translation.setInputText, appState.setMirrorInputText],
  );

  const onVoiceFinalText = useCallback(
    (text: string, isMirror = false) => {
      console.log('✅ Voice callback - onFinalText:', { text, isMirror });
      if (isMirror) {
        appState.setMirrorInputText(text);
      } else {
        translation.setInputText(text);
      }
    },
    [translation.setInputText, appState.setMirrorInputText],
  );

  const voiceCallbacks = {
    onTextUpdate: onVoiceTextUpdate,
    onFinalText: onVoiceFinalText,
  };

  const voice = useVoiceRecognition(voiceCallbacks);
  const tts = useTextToSpeech();

  // Show loading screen if model is not ready
  if (!gemmaModel.isModelReady) {
    return <LoadingScreen message={gemmaModel.loadingMessage} />;
  }

  // Action handlers
  const handleTranslate = () => {
    translation.translateText(
      translation.inputText,
      appState.sourceLanguage,
      appState.targetLanguage,
      false,
    );
  };

  const handleMirrorTranslate = () => {
    translation.translateText(
      appState.mirrorInputText,
      appState.targetLanguage, // Swapped for mirror mode
      appState.sourceLanguage, // Swapped for mirror mode
      true,
    );
  };

  const handleVoiceToggle = () => {
    voice.toggleListening(appState.sourceLanguage);
  };

  const handleMirrorVoiceToggle = () => {
    voice.toggleMirrorListening(appState.targetLanguage);
  };

  const handleSpeakInput = () => {
    tts.speakText(
      translation.inputText,
      appState.sourceLanguage.code.split('-')[0],
      true,
    );
  };

  const handleSpeakOutput = () => {
    tts.speakText(
      translation.translatedText,
      appState.targetLanguage.code.split('-')[0],
      false,
    );
  };

  const handleSpeakMirrorInput = () => {
    tts.speakText(
      appState.mirrorInputText,
      appState.targetLanguage.code.split('-')[0],
      true,
    );
  };

  const handleSpeakMirrorOutput = () => {
    tts.speakText(
      appState.mirrorTranslatedText,
      appState.sourceLanguage.code.split('-')[0],
      false,
    );
  };

  const handleClearAll = () => {
    translation.setInputText('');
    translation.setTranslatedText('');
    appState.clearAllTexts();
    tts.stopSpeaking();
  };

  const handleSwapLanguages = () => {
    appState.swapLanguages();

    // Swap main translation texts
    const tempText = translation.inputText;
    translation.setInputText(translation.translatedText);
    translation.setTranslatedText(tempText);
  };

  const handleToggleMirrorMode = () => {
    appState.toggleMirrorMode();
    Vibration.vibrate(50);
  };

  const commonProps = {
    // Languages
    sourceLanguage: appState.sourceLanguage,
    targetLanguage: appState.targetLanguage,

    // Translation
    isTranslating: translation.isTranslating,

    // Voice
    hasAudioPermission: voice.hasAudioPermission,

    // TTS
    isTtsInitialized: tts.isTtsInitialized,
    isSpeakingInput: tts.isSpeakingInput,
    isSpeakingOutput: tts.isSpeakingOutput,

    // UI State
    showMenu: appState.showMenu,
    showSourceSelector: appState.showSourceSelector,
    showTargetSelector: appState.showTargetSelector,
    sourceSearchQuery: appState.sourceSearchQuery,
    targetSearchQuery: appState.targetSearchQuery,

    // Actions
    onStopSpeaking: tts.stopSpeaking,
    onClearAll: handleClearAll,

    // Language Actions
    onSourceLanguageSelect: appState.setSourceLanguage,
    onTargetLanguageSelect: appState.setTargetLanguage,
    onSwapLanguages: handleSwapLanguages,

    // UI Actions
    onMirrorModeToggle: handleToggleMirrorMode,
    onMenuToggle: () => appState.setShowMenu(true),
    onCloseMenu: () => appState.setShowMenu(false),
    onShowSourceSelector: appState.setShowSourceSelector,
    onShowTargetSelector: appState.setShowTargetSelector,
    onSourceSearchChange: appState.setSourceSearchQuery,
    onTargetSearchChange: appState.setTargetSearchQuery,
  };

  // Render appropriate mode
  if (appState.isMirrorMode) {
    return (
      <MirrorMode
        {...commonProps}
        // Mirror-specific props
        mirrorInputText={appState.mirrorInputText}
        mirrorTranslatedText={appState.mirrorTranslatedText}
        isMirrorListening={voice.isMirrorListening}
        isMirrorProcessingVoice={voice.isMirrorProcessingVoice}
        // Mirror-specific actions
        onMirrorInputTextChange={appState.setMirrorInputText}
        onMirrorTranslate={handleMirrorTranslate}
        onMirrorVoiceToggle={handleMirrorVoiceToggle}
        onSpeakMirrorInput={handleSpeakMirrorInput}
        onSpeakMirrorOutput={handleSpeakMirrorOutput}
      />
    );
  }

  return (
    <NormalMode
      {...commonProps}
      // Normal mode specific props
      inputText={translation.inputText}
      translatedText={translation.translatedText}
      isListening={voice.isListening}
      isProcessingVoice={voice.isProcessingVoice}
      // Normal mode specific actions
      onInputTextChange={translation.setInputText}
      onTranslate={handleTranslate}
      onVoiceToggle={handleVoiceToggle}
      onSpeakInput={handleSpeakInput}
      onSpeakOutput={handleSpeakOutput}
    />
  );
};

export default VoiceLoopApp;

import React, { useCallback, useState } from 'react';
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

  // Mirror mode state - flexible for any two languages
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [lastTranslationDirection, setLastTranslationDirection] = useState<
    'source-to-target' | 'target-to-source' | null
  >(null);

  // Translation callbacks for NORMAL mode
  const normalTranslationCallbacks = {
    onMirrorTranslationUpdate: (text: string) => {
      // Not used in normal mode
    },
    onMirrorTranslationComplete: (text: string) => {
      // Not used in normal mode
    },
    reloadModel: gemmaModel.loadGemmaModel,
  };

  // Translation callbacks for MIRROR mode
  const mirrorTranslationCallbacks = {
    onMirrorTranslationUpdate: (text: string) => {
      console.log('🪞 Mirror translation update:', text);
      // Update the target language text based on translation direction
      if (lastTranslationDirection === 'source-to-target') {
        setTargetText(text);
      } else if (lastTranslationDirection === 'target-to-source') {
        setSourceText(text);
      }
    },
    onMirrorTranslationComplete: (text: string) => {
      console.log('🪞 Mirror translation complete:', text);
      // Set the final translated text
      if (lastTranslationDirection === 'source-to-target') {
        setTargetText(text);
      } else if (lastTranslationDirection === 'target-to-source') {
        setSourceText(text);
      }
    },
    reloadModel: gemmaModel.loadGemmaModel,
  };

  // Use appropriate callbacks based on current mode
  const currentCallbacks = appState.isMirrorMode
    ? mirrorTranslationCallbacks
    : normalTranslationCallbacks;

  const translation = useTranslation(gemmaModel.isModelReady, currentCallbacks);

  // Voice recognition callbacks - language-specific
  const onVoiceTextUpdate = useCallback(
    (text: string, isMirror = false) => {
      console.log('📝 Voice callback - onTextUpdate:', { text, isMirror });
      if (appState.isMirrorMode) {
        // In mirror mode, determine which language this is for
        if (isMirror) {
          // This is from the partner's (top) microphone - target language
          setTargetText(text);
        } else {
          // This is from the user's (bottom) microphone - source language
          setSourceText(text);
        }
      } else {
        translation.setInputText(text);
      }
    },
    [translation.setInputText, appState.isMirrorMode],
  );

  const onVoiceFinalText = useCallback(
    (text: string, isMirror = false) => {
      console.log('✅ Voice callback - onFinalText:', { text, isMirror });
      if (appState.isMirrorMode) {
        // In mirror mode, determine which language this is for
        if (isMirror) {
          // This is from the partner's (top) microphone - target language
          setTargetText(text);
        } else {
          // This is from the user's (bottom) microphone - source language
          setSourceText(text);
        }
      } else {
        translation.setInputText(text);
      }
    },
    [translation.setInputText, appState.isMirrorMode],
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

  // Action handlers for NORMAL mode
  const handleTranslate = () => {
    console.log('🔄 Normal mode translate:', translation.inputText);
    translation.translateText(
      translation.inputText,
      appState.sourceLanguage,
      appState.targetLanguage,
      false,
    );
  };

  // Action handlers for MIRROR mode - flexible for any languages
  const handleMirrorTranslateSource = () => {
    console.log(
      `🔄 Translating ${appState.sourceLanguage.name} to ${appState.targetLanguage.name}:`,
      sourceText,
    );
    setLastTranslationDirection('source-to-target');
    translation.translateText(
      sourceText,
      appState.sourceLanguage, // FROM source language
      appState.targetLanguage, // TO target language
      true,
    );
  };

  const handleMirrorTranslateTarget = () => {
    console.log(
      `🔄 Translating ${appState.targetLanguage.name} to ${appState.sourceLanguage.name}:`,
      targetText,
    );
    setLastTranslationDirection('target-to-source');
    translation.translateText(
      targetText,
      appState.targetLanguage, // FROM target language
      appState.sourceLanguage, // TO source language
      true,
    );
  };

  const handleVoiceToggle = () => {
    voice.toggleListening(appState.sourceLanguage);
  };

  const handleMirrorVoiceToggleSource = () => {
    // Source language voice recognition (bottom side)
    voice.toggleListening(appState.sourceLanguage);
  };

  const handleMirrorVoiceToggleTarget = () => {
    // Target language voice recognition (top side)
    voice.toggleMirrorListening(appState.targetLanguage);
  };

  const handleSpeakInput = () => {
    const textToSpeak = appState.isMirrorMode
      ? sourceText
      : translation.inputText;
    const languageCode = appState.sourceLanguage.code.split('-')[0];

    tts.speakText(textToSpeak, languageCode, true);
  };

  const handleSpeakOutput = () => {
    const textToSpeak = appState.isMirrorMode
      ? targetText
      : translation.translatedText;
    const languageCode = appState.targetLanguage.code.split('-')[0];

    tts.speakText(textToSpeak, languageCode, false);
  };

  const handleSpeakSource = () => {
    tts.speakText(sourceText, appState.sourceLanguage.code.split('-')[0], true);
  };

  const handleSpeakTarget = () => {
    tts.speakText(targetText, appState.targetLanguage.code.split('-')[0], true);
  };

  const handleClearAll = () => {
    if (appState.isMirrorMode) {
      // Clear both language texts
      setSourceText('');
      setTargetText('');
      setLastTranslationDirection(null);
    } else {
      translation.setInputText('');
      translation.setTranslatedText('');
    }
    tts.stopSpeaking();
  };

  const handleSwapLanguages = () => {
    appState.swapLanguages();

    if (appState.isMirrorMode) {
      // In mirror mode, swap the language texts
      const tempText = sourceText;
      setSourceText(targetText);
      setTargetText(tempText);
    } else {
      // In normal mode, swap main translation texts
      const tempText = translation.inputText;
      translation.setInputText(translation.translatedText);
      translation.setTranslatedText(tempText);
    }
  };

  const handleToggleMirrorMode = () => {
    console.log('🪞 Toggling mirror mode. Current:', appState.isMirrorMode);
    appState.toggleMirrorMode();
    Vibration.vibrate(50);

    // Clear all text when switching modes to avoid confusion
    translation.setInputText('');
    translation.setTranslatedText('');
    setSourceText('');
    setTargetText('');
    setLastTranslationDirection(null);
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
    console.log('🪞 Rendering Mirror Mode with flexible texts:', {
      sourceLanguage: appState.sourceLanguage.name,
      targetLanguage: appState.targetLanguage.name,
      sourceText: sourceText,
      targetText: targetText,
      lastDirection: lastTranslationDirection,
    });

    return (
      <MirrorMode
        {...commonProps}
        // Mirror-specific props - now flexible for any languages
        sourceText={sourceText}
        targetText={targetText}
        lastTranslationDirection={lastTranslationDirection}
        isMirrorListening={voice.isMirrorListening}
        isMirrorProcessingVoice={voice.isMirrorProcessingVoice}
        isListening={voice.isListening}
        isProcessingVoice={voice.isProcessingVoice}
        // Mirror-specific actions - now language-agnostic
        onSourceTextChange={setSourceText}
        onTargetTextChange={setTargetText}
        onTranslateSource={handleMirrorTranslateSource}
        onTranslateTarget={handleMirrorTranslateTarget}
        onSourceVoiceToggle={handleMirrorVoiceToggleSource}
        onTargetVoiceToggle={handleMirrorVoiceToggleTarget}
        onSpeakSource={handleSpeakSource}
        onSpeakTarget={handleSpeakTarget}
      />
    );
  }

  console.log('📱 Rendering Normal Mode with texts:', {
    input: translation.inputText,
    translated: translation.translatedText,
  });

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

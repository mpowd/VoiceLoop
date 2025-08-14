import React, { useCallback, useState, useEffect } from 'react';
import { Vibration, NativeModules, NativeEventEmitter } from 'react-native';

// Components
import LoadingScreen from './components/LoadingScreen';
import NormalMode from './components/NormalMode';
import MirrorMode from './components/MirrorMode';
import ChatMode from './components/ChatMode';

// Hooks
import { useGemmaModel } from './hooks/useGemmaModel';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useTranslation } from './hooks/useTranslation';
import { useAppState } from './hooks/useAppState';

// Types
import { ChatMessage } from './types';

const { GemmaLLM } = NativeModules;

const VoiceLoopApp: React.FC = () => {
  // Initialize all hooks
  const gemmaModel = useGemmaModel();
  const appState = useAppState();

  // Mirror mode state - simplified
  const [sourceInputText, setSourceInputText] = useState(''); // Person A input
  const [targetInputText, setTargetInputText] = useState(''); // Person B input
  const [sourceResultText, setSourceResultText] = useState(''); // Translation result for Person A
  const [targetResultText, setTargetResultText] = useState(''); // Translation result for Person B

  // Chat mode state
  const [isChatGenerating, setIsChatGenerating] = useState(false);

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

  // Track current translation direction
  const [currentTranslationDirection, setCurrentTranslationDirection] =
    useState<'source-to-target' | 'target-to-source' | null>(null);

  // Translation callbacks for MIRROR mode
  const mirrorTranslationCallbacks = {
    onMirrorTranslationUpdate: (text: string) => {
      console.log('🪞 Mirror translation update:', text);
    },
    onMirrorTranslationComplete: (text: string) => {
      console.log('🪞 Mirror translation complete:', text);
      // Set the result based on current translation direction
      if (currentTranslationDirection === 'source-to-target') {
        setTargetResultText(text);
        console.log('✅ Translation result set for Person B (target):', text);
      } else if (currentTranslationDirection === 'target-to-source') {
        setSourceResultText(text);
        console.log('✅ Translation result set for Person A (source):', text);
      }
      // Reset direction
      setCurrentTranslationDirection(null);
    },
    reloadModel: gemmaModel.loadGemmaModel,
  };

  // Use appropriate callbacks based on current mode
  const currentCallbacks = appState.isMirrorMode
    ? mirrorTranslationCallbacks
    : normalTranslationCallbacks;

  const translation = useTranslation(gemmaModel.isModelReady, currentCallbacks);

  // Voice recognition callbacks
  const onVoiceTextUpdate = useCallback(
    (text: string, isMirror = false) => {
      console.log('📝 Voice callback - onTextUpdate:', { text, isMirror });
      if (appState.isMirrorMode) {
        if (isMirror) {
          // Person B (top) input
          setTargetInputText(text);
        } else {
          // Person A (bottom) input
          setSourceInputText(text);
        }
      } else if (!appState.isChatMode) {
        translation.setInputText(text);
      }
    },
    [translation.setInputText, appState.isMirrorMode, appState.isChatMode],
  );

  const onVoiceFinalText = useCallback(
    (text: string, isMirror = false) => {
      console.log('✅ Voice callback - onFinalText:', { text, isMirror });
      if (appState.isMirrorMode) {
        if (isMirror) {
          // Person B (top) final input
          setTargetInputText(text);
        } else {
          // Person A (bottom) final input
          setSourceInputText(text);
        }
      } else if (!appState.isChatMode) {
        translation.setInputText(text);
      }
    },
    [translation.setInputText, appState.isMirrorMode, appState.isChatMode],
  );

  const voiceCallbacks = {
    onTextUpdate: onVoiceTextUpdate,
    onFinalText: onVoiceFinalText,
  };

  const voice = useVoiceRecognition(voiceCallbacks);
  const tts = useTextToSpeech();

  // Chat functionality
  const handleSendChatMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isChatGenerating) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      appState.addChatMessage(userMessage);

      try {
        setIsChatGenerating(true);

        // Reset session for clean chat context
        if (GemmaLLM && typeof GemmaLLM.resetSession === 'function') {
          await GemmaLLM.resetSession();
        }

        // Generate response using the Gemma model
        if (GemmaLLM && typeof GemmaLLM.generateResponse === 'function') {
          const response = await GemmaLLM.generateResponse(message);

          // Add assistant response
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          };
          appState.addChatMessage(assistantMessage);
        } else {
          throw new Error('Chat functionality not available');
        }
      } catch (error) {
        console.error('❌ Chat generation failed:', error);

        // Add error message
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error while processing your message. Please try again.',
          timestamp: new Date(),
        };
        appState.addChatMessage(errorMessage);
      } finally {
        setIsChatGenerating(false);
      }
    },
    [isChatGenerating, appState],
  );

  // Listen for async chat responses (if using streaming)
  useEffect(() => {
    if (!GemmaLLM) return;

    const eventEmitter = new NativeEventEmitter(GemmaLLM);
    const subscription = eventEmitter.addListener('llmResponse', data => {
      if (appState.isChatMode && data.type === 'chat' && data.done) {
        // Handle streaming chat response completion
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.text,
          timestamp: new Date(),
        };
        appState.addChatMessage(assistantMessage);
        setIsChatGenerating(false);
      }
    });

    return () => subscription.remove();
  }, [appState.isChatMode, appState]);

  // Show loading screen if model is not ready
  if (!gemmaModel.isModelReady) {
    return <LoadingScreen message={gemmaModel.loadingMessage} />;
  }

  // Action handlers for NORMAL mode
  const handleTranslate = () => {
    console.log('🔄 Normal mode translate:', translation.inputText);
    voice.stopListening();
    translation.translateText(
      translation.inputText,
      appState.sourceLanguage,
      appState.targetLanguage,
      false,
    );
  };

  // Action handlers for MIRROR mode
  const handleMirrorTranslateSource = () => {
    console.log(
      `🔄 Person A translating ${appState.sourceLanguage.name} to ${appState.targetLanguage.name}:`,
      sourceInputText,
    );

    voice.stopListening();

    // Set translation direction before starting translation
    setCurrentTranslationDirection('source-to-target');

    // Start translation - result will be handled in callback
    translation.translateText(
      sourceInputText,
      appState.sourceLanguage,
      appState.targetLanguage,
      true, // isFromMirror = true
    );
  };

  const handleMirrorTranslateTarget = () => {
    console.log(
      `🔄 Person B translating ${appState.targetLanguage.name} to ${appState.sourceLanguage.name}:`,
      targetInputText,
    );

    voice.stopMirrorListening();

    // Set translation direction before starting translation
    setCurrentTranslationDirection('target-to-source');

    // Start translation - result will be handled in callback
    translation.translateText(
      targetInputText,
      appState.targetLanguage,
      appState.sourceLanguage,
      true, // isFromMirror = true
    );
  };

  const handleVoiceToggle = () => {
    voice.toggleListening(appState.sourceLanguage);
  };

  const handleMirrorVoiceToggleSource = () => {
    // Person A voice recognition (bottom side)
    voice.toggleListening(appState.sourceLanguage);
  };

  const handleMirrorVoiceToggleTarget = () => {
    // Person B voice recognition (top side)
    voice.toggleMirrorListening(appState.targetLanguage);
  };

  const handleSpeakInput = () => {
    const textToSpeak = appState.isMirrorMode
      ? sourceInputText
      : translation.inputText;
    const languageCode = appState.sourceLanguage.code.split('-')[0];
    tts.speakText(textToSpeak, languageCode, true);
  };

  const handleSpeakOutput = () => {
    const textToSpeak = appState.isMirrorMode
      ? targetResultText
      : translation.translatedText;
    const languageCode = appState.targetLanguage.code.split('-')[0];
    tts.speakText(textToSpeak, languageCode, false);
  };

  const handleSpeakSource = () => {
    tts.speakText(
      sourceInputText,
      appState.sourceLanguage.code.split('-')[0],
      true,
    );
  };

  const handleSpeakTarget = () => {
    tts.speakText(
      targetInputText,
      appState.targetLanguage.code.split('-')[0],
      true,
    );
  };

  const handleSpeakSourceResult = () => {
    tts.speakText(
      sourceResultText,
      appState.sourceLanguage.code.split('-')[0],
      false,
    );
  };

  const handleSpeakTargetResult = () => {
    tts.speakText(
      targetResultText,
      appState.targetLanguage.code.split('-')[0],
      false,
    );
  };

  const handleClearAll = () => {
    // Stop any active voice recognition
    voice.stopListening();
    voice.stopMirrorListening();

    if (appState.isChatMode) {
      // Clear chat messages
      appState.clearChatMessages();
    } else if (appState.isMirrorMode) {
      // Clear all texts
      setSourceInputText('');
      setTargetInputText('');
      setSourceResultText('');
      setTargetResultText('');
    } else {
      translation.setInputText('');
      translation.setTranslatedText('');
    }
    tts.stopSpeaking();
  };

  const handleSwapLanguages = () => {
    appState.swapLanguages();

    if (appState.isMirrorMode) {
      // In mirror mode, swap all texts
      const tempInput = sourceInputText;
      const tempResult = sourceResultText;
      setSourceInputText(targetInputText);
      setSourceResultText(targetResultText);
      setTargetInputText(tempInput);
      setTargetResultText(tempResult);
    } else if (!appState.isChatMode) {
      // In normal mode, swap main translation texts
      const tempText = translation.inputText;
      translation.setInputText(translation.translatedText);
      translation.setTranslatedText(tempText);
    }
  };

  const handleToggleMirrorMode = () => {
    console.log('🪞 Toggling mirror mode. Current:', appState.isMirrorMode);

    // Stop all voice recognition before switching modes
    voice.stopListening();
    voice.stopMirrorListening();

    appState.toggleMirrorMode();
    Vibration.vibrate(50);

    // Clear all texts when switching modes
    translation.setInputText('');
    translation.setTranslatedText('');
    setSourceInputText('');
    setTargetInputText('');
    setSourceResultText('');
    setTargetResultText('');
    setCurrentTranslationDirection(null);
  };

  const handleToggleChatMode = () => {
    console.log('💬 Toggling chat mode. Current:', appState.isChatMode);

    // Stop all voice recognition before switching modes
    voice.stopListening();
    voice.stopMirrorListening();

    appState.toggleChatMode();
    Vibration.vibrate(50);

    // Clear translation texts when switching to chat mode
    if (!appState.isChatMode) {
      translation.setInputText('');
      translation.setTranslatedText('');
      setSourceInputText('');
      setTargetInputText('');
      setSourceResultText('');
      setTargetResultText('');
      setCurrentTranslationDirection(null);
    }
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
    onChatModeToggle: handleToggleChatMode,
    onShowSourceSelector: appState.setShowSourceSelector,
    onShowTargetSelector: appState.setShowTargetSelector,
    onSourceSearchChange: appState.setSourceSearchQuery,
    onTargetSearchChange: appState.setTargetSearchQuery,
    onMenuToggle: () => appState.setShowMenu(!appState.showMenu),
    onCloseMenu: () => appState.setShowMenu(false),
  };

  // Render Chat Mode
  if (appState.isChatMode) {
    console.log(
      '💬 Rendering Chat Mode with messages:',
      appState.chatMessages.length,
    );

    return (
      <ChatMode
        {...commonProps}
        // Chat-specific props
        messages={appState.chatMessages}
        isGenerating={isChatGenerating}
        // Chat-specific actions
        onSendMessage={handleSendChatMessage}
        onClearChat={appState.clearChatMessages}
      />
    );
  }

  // Render Mirror Mode
  if (appState.isMirrorMode) {
    console.log('🪞 Rendering Mirror Mode with simplified texts:', {
      sourceLanguage: appState.sourceLanguage.name,
      targetLanguage: appState.targetLanguage.name,
      sourceInputText,
      targetInputText,
      sourceResultText,
      targetResultText,
    });

    return (
      <MirrorMode
        {...commonProps}
        // Mirror-specific props - simplified
        sourceInputText={sourceInputText}
        targetInputText={targetInputText}
        sourceResultText={sourceResultText}
        targetResultText={targetResultText}
        isMirrorListening={voice.isMirrorListening}
        isMirrorProcessingVoice={voice.isMirrorProcessingVoice}
        isListening={voice.isListening}
        isProcessingVoice={voice.isProcessingVoice}
        // Mirror-specific actions - simplified
        onSourceInputChange={setSourceInputText}
        onTargetInputChange={setTargetInputText}
        onTranslateSource={handleMirrorTranslateSource}
        onTranslateTarget={handleMirrorTranslateTarget}
        onSourceVoiceToggle={handleMirrorVoiceToggleSource}
        onTargetVoiceToggle={handleMirrorVoiceToggleTarget}
        onSpeakSourceInput={handleSpeakSource}
        onSpeakTargetInput={handleSpeakTarget}
        onSpeakSourceResult={handleSpeakSourceResult}
        onSpeakTargetResult={handleSpeakTargetResult}
      />
    );
  }

  // Render Normal Mode
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

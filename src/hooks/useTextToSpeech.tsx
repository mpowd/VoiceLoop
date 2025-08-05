import { useState, useEffect } from 'react';
import { Alert, Vibration } from 'react-native';
import Tts from 'react-native-tts';
import { TTSState } from '../types';
import { cleanTextForTTS, formatLanguageForTTS } from '../utils/helpers';

interface TextToSpeechHook extends TTSState {
  speakText: (
    text: string,
    languageCode: string,
    isInput?: boolean,
  ) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  findBestVoice: (languageCode: string) => any;
  initializeTts: () => Promise<void>;
  cleanup: () => void;
}

export const useTextToSpeech = (): TextToSpeechHook => {
  const [isTtsInitialized, setIsTtsInitialized] = useState(false);
  const [isSpeakingInput, setIsSpeakingInput] = useState(false);
  const [isSpeakingOutput, setIsSpeakingOutput] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  // Initialize TTS
  const initializeTts = async () => {
    try {
      console.log('=== TTS INITIALIZATION START ===');

      // Check if TTS engine is available
      await Tts.getInitStatus();
      console.log('TTS engine is available');

      // Get available voices
      const voices = await Tts.voices();
      setAvailableVoices(voices);
      console.log('Available voices:', voices.length);

      // Set up TTS event listeners
      Tts.addEventListener('tts-start', event => {
        console.log('TTS started:', event);
      });

      Tts.addEventListener('tts-finish', event => {
        console.log('TTS finished:', event);
        setIsSpeakingInput(false);
        setIsSpeakingOutput(false);
      });

      Tts.addEventListener('tts-cancel', event => {
        console.log('TTS cancelled:', event);
        setIsSpeakingInput(false);
        setIsSpeakingOutput(false);
      });

      // Set default TTS settings
      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);

      setIsTtsInitialized(true);
      console.log('✅ TTS initialized successfully');
    } catch (error) {
      console.error('=== TTS INITIALIZATION ERROR ===');
      console.error('TTS Error:', error);

      if ((error as any).code === 'no_engine') {
        Alert.alert(
          'TTS Engine Missing',
          'No Text-to-Speech engine found. Would you like to install one?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Install',
              onPress: () => Tts.requestInstallEngine(),
            },
          ],
        );
      } else {
        console.log('TTS initialization failed, but continuing without TTS');
      }
    }
  };

  // Find best voice for language
  const findBestVoice = (languageCode: string) => {
    // Find voice that matches the language code
    const exactMatch = availableVoices.find(
      voice => voice.language === languageCode,
    );

    if (exactMatch) return exactMatch;

    // Find voice with same language prefix (e.g., 'en' matches 'en-US')
    const prefixMatch = availableVoices.find(voice =>
      voice.language.startsWith(languageCode.split('-')[0]),
    );

    return prefixMatch;
  };

  // Speak text function
  const speakText = async (
    text: string,
    languageCode: string,
    isInput = false,
  ) => {
    if (!isTtsInitialized) {
      Alert.alert('TTS Error', 'Text-to-Speech not available');
      return;
    }

    if (!text || text.trim().length === 0) {
      Alert.alert('Notice', 'No text to speak');
      return;
    }

    // Clean text for TTS
    const cleanText = cleanTextForTTS(text);

    if (cleanText.length === 0) {
      Alert.alert('Notice', 'No speakable text found');
      return;
    }

    try {
      // Stop any current speech
      await Tts.stop();

      // Set speaking state
      if (isInput) {
        setIsSpeakingInput(true);
        setIsSpeakingOutput(false);
      } else {
        setIsSpeakingOutput(true);
        setIsSpeakingInput(false);
      }

      // Find best voice for language
      const bestVoice = findBestVoice(languageCode);
      if (bestVoice) {
        console.log(`Setting voice for ${languageCode}:`, bestVoice.id);
        await Tts.setDefaultVoice(bestVoice.id);
      }

      // Set language (convert from our format to TTS format)
      const ttsLanguage = formatLanguageForTTS(languageCode);
      await Tts.setDefaultLanguage(ttsLanguage);

      console.log(
        `Speaking text in ${ttsLanguage}: "${cleanText.substring(0, 50)}..."`,
      );

      // Speak the text
      await Tts.speak(cleanText);

      Vibration.vibrate(30);
    } catch (error) {
      console.error('TTS speak error:', error);
      setIsSpeakingInput(false);
      setIsSpeakingOutput(false);
      Alert.alert('TTS Error', `Failed to speak: ${(error as Error).message}`);
    }
  };

  // Stop speaking function
  const stopSpeaking = async () => {
    try {
      await Tts.stop();
      setIsSpeakingInput(false);
      setIsSpeakingOutput(false);
      console.log('TTS stopped');
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
  };

  // Cleanup function
  const cleanup = () => {
    try {
      Tts.stop();
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      console.log('✅ TTS cleaned up');
    } catch (error) {
      console.error('TTS cleanup error:', error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeTts();
    return cleanup;
  }, []);

  return {
    isTtsInitialized,
    isSpeakingInput,
    isSpeakingOutput,
    availableVoices,
    speakText,
    stopSpeaking,
    findBestVoice,
    initializeTts,
    cleanup,
  };
};

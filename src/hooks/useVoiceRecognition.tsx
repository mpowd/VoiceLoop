import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert, Vibration } from 'react-native';
import Voice from '@react-native-voice/voice';
import { Language, VoiceState } from '../types';

interface VoiceRecognitionHook extends VoiceState {
  isMirrorListening: boolean;
  isMirrorProcessingVoice: boolean;
  toggleListening: (language: Language) => Promise<void>;
  toggleMirrorListening: (language: Language) => Promise<void>;
  stopListening: () => Promise<void>;
  stopMirrorListening: () => Promise<void>;
  initializeVoice: () => Promise<void>;
  cleanup: () => void;
}

interface VoiceCallbacks {
  onTextUpdate: (text: string, isMirror?: boolean) => void;
  onFinalText: (text: string, isMirror?: boolean) => void;
}

export const useVoiceRecognition = (
  callbacks: VoiceCallbacks,
): VoiceRecognitionHook => {
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isMirrorListening, setIsMirrorListening] = useState(false);
  const [isMirrorProcessingVoice, setIsMirrorProcessingVoice] = useState(false);

  // Use refs to always have current values in event handlers
  const isListeningRef = useRef(isListening);
  const isMirrorListeningRef = useRef(isMirrorListening);
  const callbacksRef = useRef(callbacks);
  const currentLanguageRef = useRef<Language | null>(null);

  // Text accumulation for continuous listening
  const accumulatedTextRef = useRef<string>('');
  const currentPartialTextRef = useRef<string>('');

  // Auto-restart configuration
  const autoRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoRestartingRef = useRef(false);
  const RESTART_DELAY = 100; // Very short delay for immediate restart

  // Update refs when values change
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isMirrorListeningRef.current = isMirrorListening;
  }, [isMirrorListening]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Clear auto-restart timeout
  const clearAutoRestart = () => {
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
      autoRestartTimeoutRef.current = null;
    }
  };

  // Restart voice recognition immediately
  const restartVoiceRecognition = async () => {
    if (!currentLanguageRef.current || isAutoRestartingRef.current) return;

    isAutoRestartingRef.current = true;
    console.log('🔄 Auto-restarting voice recognition...');

    try {
      await Voice.stop();

      setTimeout(async () => {
        try {
          if (
            currentLanguageRef.current &&
            (isListeningRef.current || isMirrorListeningRef.current)
          ) {
            await Voice.start(currentLanguageRef.current.code);
            console.log(
              `✅ Voice restarted for ${currentLanguageRef.current.code}`,
            );
          }
        } catch (error) {
          console.log('⚠️ Failed to restart voice recognition:', error);
        } finally {
          isAutoRestartingRef.current = false;
        }
      }, RESTART_DELAY);
    } catch (error) {
      console.log('⚠️ Error during voice restart:', error);
      isAutoRestartingRef.current = false;
    }
  };

  // Request audio permission
  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        setHasAudioPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.error('Permission request error:', err);
        setHasAudioPermission(false);
      }
    } else {
      setHasAudioPermission(true);
    }
  };

  // Initialize Voice recognition
  const initializeVoice = async () => {
    try {
      Voice.onSpeechStart = () => {
        console.log('🎤 Speech started');
        setIsProcessingVoice(false);
        setIsMirrorProcessingVoice(false);
        clearAutoRestart();

        // Reset current partial text for new speech segment
        currentPartialTextRef.current = '';
      };

      Voice.onSpeechEnd = () => {
        console.log('🛑 Speech ended - will process...');

        if (isListeningRef.current) {
          setIsProcessingVoice(true);
        }
        if (isMirrorListeningRef.current) {
          setIsMirrorProcessingVoice(true);
        }
      };

      // Real-time transcription during speech
      Voice.onSpeechPartialResults = async e => {
        if (e.value && e.value.length > 0) {
          const partialText = e.value[0];
          currentPartialTextRef.current = partialText;

          // Combine accumulated text with current partial text
          const combinedText = accumulatedTextRef.current
            ? `${accumulatedTextRef.current} ${partialText}`.trim()
            : partialText;

          // Update the appropriate text field
          if (isListeningRef.current) {
            callbacksRef.current.onTextUpdate(combinedText, false);
          } else if (isMirrorListeningRef.current) {
            callbacksRef.current.onTextUpdate(combinedText, true);
          }
        }
      };

      Voice.onSpeechResults = async e => {
        console.log('📝 Final speech results received:', e.value);

        if (e.value && e.value.length > 0) {
          const spokenText = e.value[0];
          console.log('✅ Final recognized text:', spokenText);

          // Add the final text to accumulated text
          if (accumulatedTextRef.current) {
            accumulatedTextRef.current =
              `${accumulatedTextRef.current} ${spokenText}`.trim();
          } else {
            accumulatedTextRef.current = spokenText;
          }

          console.log('📝 Total accumulated text:', accumulatedTextRef.current);

          // Update with final accumulated text
          if (isListeningRef.current) {
            callbacksRef.current.onFinalText(accumulatedTextRef.current, false);
          } else if (isMirrorListeningRef.current) {
            callbacksRef.current.onFinalText(accumulatedTextRef.current, true);
          }

          Vibration.vibrate(50);
        }

        setIsProcessingVoice(false);
        setIsMirrorProcessingVoice(false);

        // Continue listening by restarting immediately
        if (
          (isListeningRef.current || isMirrorListeningRef.current) &&
          currentLanguageRef.current
        ) {
          autoRestartTimeoutRef.current = setTimeout(() => {
            restartVoiceRecognition();
          }, RESTART_DELAY);
        }
      };

      Voice.onSpeechError = e => {
        console.log('⚠️ Voice error (silent):', e.error?.code);

        setIsProcessingVoice(false);
        setIsMirrorProcessingVoice(false);

        const errorCode = e.error?.code;
        const transientErrors = ['5', '6', '7', '8', '11', '12'];

        if (transientErrors.includes(errorCode)) {
          // Handle transient errors by restarting
          if (
            (isListeningRef.current || isMirrorListeningRef.current) &&
            currentLanguageRef.current
          ) {
            console.log('🔄 Handling transient error, restarting...');
            autoRestartTimeoutRef.current = setTimeout(() => {
              restartVoiceRecognition();
            }, 300);
            return;
          }
        }

        // For other errors, stop completely
        setIsListening(false);
        setIsMirrorListening(false);
        currentLanguageRef.current = null;
        clearAutoRestart();
      };
    } catch (error) {
      console.error('Voice initialization failed:', error);
    }
  };

  // Toggle main microphone
  const toggleListening = async (language: Language) => {
    console.log('🔄 Toggling voice recognition...', { isListening });

    if (!hasAudioPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required for voice input',
      );
      return;
    }

    if (isProcessingVoice || isMirrorListening) {
      console.log('⚠️ Still processing or mirror is active');
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        console.log('🛑 Stopping voice recognition...');
        clearAutoRestart();
        currentLanguageRef.current = null;

        // Clear accumulated text when manually stopping
        accumulatedTextRef.current = '';
        currentPartialTextRef.current = '';

        await Voice.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping voice recognition:', error);
        setIsListening(false);
      }
    } else {
      // Start listening
      try {
        console.log('🚀 Starting voice recognition...');

        // Clear accumulated text when manually starting
        accumulatedTextRef.current = '';
        currentPartialTextRef.current = '';

        setIsListening(true);
        setIsProcessingVoice(false);
        currentLanguageRef.current = language;

        await Voice.start(language.code);
        console.log(`✅ Voice.start(${language.code}) successful`);
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
        currentLanguageRef.current = null;
      }
    }
  };

  // Toggle mirror microphone
  const toggleMirrorListening = async (language: Language) => {
    console.log('🔄 Toggling mirror voice recognition...', {
      isMirrorListening,
    });

    if (!hasAudioPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required for voice input',
      );
      return;
    }

    if (isMirrorProcessingVoice || isListening) {
      console.log('⚠️ Still processing or main is active');
      return;
    }

    if (isMirrorListening) {
      // Stop listening
      try {
        console.log('🛑 Stopping mirror voice recognition...');
        clearAutoRestart();
        currentLanguageRef.current = null;

        // Clear accumulated text when manually stopping
        accumulatedTextRef.current = '';
        currentPartialTextRef.current = '';

        await Voice.stop();
        setIsMirrorListening(false);
      } catch (error) {
        console.error('Error stopping mirror voice recognition:', error);
        setIsMirrorListening(false);
      }
    } else {
      // Start listening
      try {
        console.log('🚀 Starting mirror voice recognition...');

        // Clear accumulated text when manually starting
        accumulatedTextRef.current = '';
        currentPartialTextRef.current = '';

        setIsMirrorListening(true);
        setIsMirrorProcessingVoice(false);
        currentLanguageRef.current = language;

        await Voice.start(language.code);
        console.log(`✅ Mirror Voice.start(${language.code}) successful`);
      } catch (error) {
        console.error('Error starting mirror voice recognition:', error);
        setIsMirrorListening(false);
        currentLanguageRef.current = null;
      }
    }
  };

  // Manual stop functions (for use after translation)
  const stopListening = async () => {
    if (!isListening) return;

    try {
      console.log('🛑 Manually stopping voice recognition...');
      clearAutoRestart();
      currentLanguageRef.current = null;

      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error manually stopping voice recognition:', error);
      setIsListening(false);
    }
  };

  const stopMirrorListening = async () => {
    if (!isMirrorListening) return;

    try {
      console.log('🛑 Manually stopping mirror voice recognition...');
      clearAutoRestart();
      currentLanguageRef.current = null;

      await Voice.stop();
      setIsMirrorListening(false);
    } catch (error) {
      console.error('Error manually stopping mirror voice recognition:', error);
      setIsMirrorListening(false);
    }
  };

  // Cleanup function
  const cleanup = () => {
    clearAutoRestart();
    currentLanguageRef.current = null;
    accumulatedTextRef.current = '';
    currentPartialTextRef.current = '';
    isAutoRestartingRef.current = false;

    if (Voice && Voice.destroy) {
      Voice.destroy().catch(console.error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    requestAudioPermission();
    initializeVoice();
    return cleanup;
  }, []);

  return {
    hasAudioPermission,
    isListening,
    isProcessingVoice,
    isMirrorListening,
    isMirrorProcessingVoice,
    toggleListening,
    toggleMirrorListening,
    stopListening,
    stopMirrorListening,
    initializeVoice,
    cleanup,
  };
};

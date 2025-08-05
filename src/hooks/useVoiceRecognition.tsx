import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert, Vibration } from 'react-native';
import Voice from '@react-native-voice/voice';
import { Language, VoiceState } from '../types';

interface VoiceRecognitionHook extends VoiceState {
  isMirrorListening: boolean;
  isMirrorProcessingVoice: boolean;
  toggleListening: (language: Language) => Promise<void>;
  toggleMirrorListening: (language: Language) => Promise<void>;
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
      };

      Voice.onSpeechEnd = () => {
        console.log('🛑 Speech ended - Processing...');
        if (isListeningRef.current) {
          setIsProcessingVoice(true);
        }
        if (isMirrorListeningRef.current) {
          setIsMirrorProcessingVoice(true);
        }
      };

      // Real-time transcription during speech
      Voice.onSpeechPartialResults = async e => {
        console.log('📝 Partial speech results:', e.value);

        if (e.value && e.value.length > 0) {
          const partialText = e.value[0];
          console.log('⏳ Partial text:', partialText);

          // Update the appropriate text field based on which microphone is active
          if (isListeningRef.current) {
            console.log(
              '📝 Calling onTextUpdate for normal mode:',
              partialText,
            );
            callbacksRef.current.onTextUpdate(partialText, false);
          } else if (isMirrorListeningRef.current) {
            console.log(
              '📝 Calling onTextUpdate for mirror mode:',
              partialText,
            );
            callbacksRef.current.onTextUpdate(partialText, true);
          }
        }
      };

      Voice.onSpeechResults = async e => {
        console.log('📝 Final speech results received:', e.value);

        if (e.value && e.value.length > 0) {
          const spokenText = e.value[0];
          console.log('✅ Final recognized text:', spokenText);

          // Set final text to the appropriate field
          if (isListeningRef.current) {
            console.log('✅ Calling onFinalText for normal mode:', spokenText);
            callbacksRef.current.onFinalText(spokenText, false);
          } else if (isMirrorListeningRef.current) {
            console.log('✅ Calling onFinalText for mirror mode:', spokenText);
            callbacksRef.current.onFinalText(spokenText, true);
          }

          Vibration.vibrate(50);
        }

        setIsProcessingVoice(false);
        setIsMirrorProcessingVoice(false);
        // Stop automatically after final results
        setIsListening(false);
        setIsMirrorListening(false);
      };

      Voice.onSpeechError = e => {
        console.log('⚠️ Voice error:', e.error);
        setIsListening(false);
        setIsMirrorListening(false);
        setIsProcessingVoice(false);
        setIsMirrorProcessingVoice(false);

        if (e.error?.code !== '5') {
          console.error('Voice error:', e.error);
        }
      };
    } catch (error) {
      console.error('Voice initialization failed:', error);
    }
  };

  // Toggle main microphone
  const toggleListening = async (language: Language) => {
    console.log('🔄 Toggling voice recognition...', {
      isListening,
      isProcessingVoice,
    });

    if (!hasAudioPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required for voice input',
      );
      return;
    }

    if (isProcessingVoice || isMirrorListening) {
      console.log('⚠️ Still processing or mirror is active, please wait');
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        console.log('🛑 Stopping voice recognition...');
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
        setIsListening(true);
        setIsProcessingVoice(false);

        await Voice.start(language.code);
        console.log(`✅ Voice.start(${language.code}) successful`);
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Toggle mirror microphone
  const toggleMirrorListening = async (language: Language) => {
    console.log('🔄 Toggling mirror voice recognition...', {
      isMirrorListening,
      isMirrorProcessingVoice,
    });

    if (!hasAudioPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required for voice input',
      );
      return;
    }

    if (isMirrorProcessingVoice || isListening) {
      console.log('⚠️ Still processing or main is active, please wait');
      return;
    }

    if (isMirrorListening) {
      // Stop listening
      try {
        console.log('🛑 Stopping mirror voice recognition...');
        await Voice.stop();
        setIsMirrorListening(false);
      } catch (error) {
        console.error('Error stopping mirror voice recognition:', error);
        setIsMirrorListening(false);
      }
    } else {
      // Start listening for target language (swapped for mirror)
      try {
        console.log('🚀 Starting mirror voice recognition...');
        setIsMirrorListening(true);
        setIsMirrorProcessingVoice(false);

        await Voice.start(language.code);
        console.log(`✅ Mirror Voice.start(${language.code}) successful`);
      } catch (error) {
        console.error('Error starting mirror voice recognition:', error);
        setIsMirrorListening(false);
      }
    }
  };

  // Cleanup function
  const cleanup = () => {
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
    initializeVoice,
    cleanup,
  };
};

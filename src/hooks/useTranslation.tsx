import { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Vibration,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import { Language, TranslationState } from '../types';

const { GemmaLLM } = NativeModules;

interface TranslationHook extends TranslationState {
  translateText: (
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    isFromMirror?: boolean,
  ) => Promise<void>;
  setInputText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  clearTranslation: () => void;
}

interface TranslationCallbacks {
  onMirrorTranslationUpdate: (text: string) => void;
  onMirrorTranslationComplete: (text: string) => void;
  reloadModel: () => Promise<void>;
}

export const useTranslation = (
  isModelReady: boolean,
  callbacks: TranslationCallbacks,
): TranslationHook => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [accumulatedTranslation, setAccumulatedTranslation] = useState('');

  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventEmitterRef = useRef<NativeEventEmitter | null>(null);
  const responseListenerRef = useRef<any>(null);

  // Setup global LLM response listener for normal mode
  useEffect(() => {
    if (GemmaLLM) {
      eventEmitterRef.current = new NativeEventEmitter(GemmaLLM);

      responseListenerRef.current = eventEmitterRef.current.addListener(
        'llmResponse',
        response => {
          console.log('=== NORMAL MODE LLM RESPONSE RECEIVED ===');
          console.log('Raw response:', JSON.stringify(response));

          // Clear timeout on successful response
          clearTranslationTimeout();

          try {
            let translationText = '';
            if (typeof response === 'string') {
              translationText = response;
              setTranslatedText(translationText);
              setIsTranslating(false);
              return;
            } else if (
              response &&
              (response.text !== undefined || response.message)
            ) {
              if (response.text !== undefined) {
                translationText = response.text;
              } else if (response.message) {
                translationText = response.message;
              }

              if (!response.done && translationText) {
                setAccumulatedTranslation(prev => {
                  const newAccumulated = prev + translationText;
                  setTranslatedText(newAccumulated);
                  return newAccumulated;
                });
              } else if (response.done) {
                setAccumulatedTranslation(prev => {
                  const finalText = prev + translationText;
                  setTranslatedText(finalText.trim());
                  setIsTranslating(false);
                  Vibration.vibrate(50);
                  return '';
                });
              }
            } else {
              translationText = 'Translation received but format unknown';
              setTranslatedText(translationText);
              setIsTranslating(false);
            }
          } catch (error) {
            console.error('Error processing normal response:', error);
            setTranslatedText('Error processing translation');
            setAccumulatedTranslation('');
            setIsTranslating(false);
          }
        },
      );
    }

    return () => {
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, []);

  // Clear any existing timeout
  const clearTranslationTimeout = () => {
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
      translationTimeoutRef.current = null;
    }
  };

  // Main translation function
  const translateText = async (
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    isFromMirror = false,
  ) => {
    console.log('🔍 translateText called with:', {
      text,
      isModelReady,
      isFromMirror,
    });

    if (!text.trim()) {
      Alert.alert('Error', 'Please enter text to translate');
      return;
    }

    if (!isModelReady) {
      console.log('⚠️ Model not ready yet - isModelReady:', isModelReady);
      Alert.alert('Error', 'Translation engine not ready!');
      return;
    }

    console.log('✅ Model is ready, proceeding with translation');
    setIsTranslating(true);

    // Clear previous timeout
    clearTranslationTimeout();

    // Set a timeout to handle stuck translations - increased to 45 seconds
    const timeout = setTimeout(() => {
      console.log('⏰ Translation timeout - resetting state');
      setIsTranslating(false);
      if (isFromMirror) {
        callbacks.onMirrorTranslationComplete(
          '❌ Translation timed out. Please try again.',
        );
      } else {
        setTranslatedText('❌ Translation timed out. Please try again.');
      }
      setAccumulatedTranslation('');
    }, 45000);

    translationTimeoutRef.current = timeout;

    try {
      const sourceLanguageName = isFromMirror
        ? targetLanguage.name
        : sourceLanguage.name;
      const targetLanguageName = isFromMirror
        ? sourceLanguage.name
        : targetLanguage.name;

      // Improved prompt to prevent formatting issues
      const prompt = `Translate this text from ${sourceLanguageName} to ${targetLanguageName}. Return only the translation, no explanations or extra text:

${text}`;

      console.log('🔄 Translating with Gemma:', {
        sourceLanguageName,
        targetLanguageName,
        text,
        isFromMirror,
      });

      setAccumulatedTranslation('');
      if (isFromMirror) {
        callbacks.onMirrorTranslationUpdate(''); // Clear previous translation for loading animation
      } else {
        setTranslatedText(''); // Clear previous translation for loading animation
      }

      // Use async method if available, otherwise fallback to sync
      if (typeof GemmaLLM.generateResponseAsync === 'function') {
        console.log('📤 Using generateResponseAsync');

        // Set up listener for mirror mode translations only
        if (isFromMirror) {
          const eventEmitter = new NativeEventEmitter(GemmaLLM);

          const mirrorResponseListener = eventEmitter.addListener(
            'llmResponse',
            response => {
              console.log('=== MIRROR LLM RESPONSE RECEIVED ===');

              // Clear timeout on successful response
              clearTranslationTimeout();

              try {
                let translationText = '';
                if (typeof response === 'string') {
                  translationText = response;
                  callbacks.onMirrorTranslationComplete(translationText);
                  setIsTranslating(false);
                  mirrorResponseListener.remove();
                  return;
                } else if (
                  response &&
                  (response.text !== undefined || response.message)
                ) {
                  if (response.text !== undefined) {
                    translationText = response.text;
                  } else if (response.message) {
                    translationText = response.message;
                  }

                  if (!response.done && translationText) {
                    setAccumulatedTranslation(prev => {
                      const newAccumulated = prev + translationText;
                      callbacks.onMirrorTranslationUpdate(newAccumulated);
                      return newAccumulated;
                    });
                  } else if (response.done) {
                    setAccumulatedTranslation(prev => {
                      const finalText = prev + translationText;
                      callbacks.onMirrorTranslationComplete(finalText.trim());
                      setIsTranslating(false);
                      Vibration.vibrate(50);
                      mirrorResponseListener.remove();
                      return '';
                    });
                  }
                }
              } catch (error) {
                console.error('Error processing mirror response:', error);
                callbacks.onMirrorTranslationComplete(
                  'Error processing translation',
                );
                setAccumulatedTranslation('');
                setIsTranslating(false);
                mirrorResponseListener.remove();
              }
            },
          );
        }

        GemmaLLM.generateResponseAsync(prompt);
      } else if (typeof GemmaLLM.generateResponse === 'function') {
        console.log('📤 Using generateResponse (sync)');
        const response = await GemmaLLM.generateResponse(prompt);
        console.log('✅ Gemma response:', response);

        let cleanedTranslation = response.trim();
        if (
          cleanedTranslation.startsWith('"') &&
          cleanedTranslation.endsWith('"')
        ) {
          cleanedTranslation = cleanedTranslation.slice(1, -1);
        }

        if (isFromMirror) {
          callbacks.onMirrorTranslationComplete(cleanedTranslation);
        } else {
          setTranslatedText(cleanedTranslation);
        }
        setIsTranslating(false);

        // Clear timeout on successful response
        clearTranslationTimeout();
      } else {
        throw new Error('No translation method available');
      }
    } catch (error) {
      console.error('❌ Translation error:', error);

      // Better error handling to prevent critical errors
      let errorMessage = 'Translation error occurred';
      if ((error as Error).message.includes('Async generation failed')) {
        errorMessage =
          '❌ Translation service temporarily unavailable. Please try again.';
        // Reset the model state to try to recover
        console.log('🔄 Attempting to recover from critical error...');
        setTimeout(() => {
          callbacks.reloadModel();
        }, 2000);
      }

      if (isFromMirror) {
        callbacks.onMirrorTranslationComplete(errorMessage);
      } else {
        setTranslatedText(errorMessage);
      }
      setIsTranslating(false);

      // Clear timeout on error
      clearTranslationTimeout();
    }
  };

  // Clear all translation data
  const clearTranslation = () => {
    setInputText('');
    setTranslatedText('');
    setAccumulatedTranslation('');
    clearTranslationTimeout();
  };

  return {
    isTranslating,
    inputText,
    translatedText,
    accumulatedTranslation,
    translateText,
    setInputText,
    setTranslatedText,
    clearTranslation,
  };
};

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

          // Handle both formats: with type field AND without type field
          if (typeof response === 'object') {
            // NEW FORMAT: Has type field
            if (response.type === 'translation') {
              console.log(
                '✅ Processing structured translation response (with type)',
              );

              // Handle errors
              if (response.error) {
                console.error('Translation error:', response.errorMessage);
                setTranslatedText(`❌ ${response.errorMessage}`);
                setIsTranslating(false);
                clearTranslationTimeout();
                return;
              }

              // Clear timeout on successful response
              clearTranslationTimeout();

              try {
                const translationText = response.text || '';

                if (!response.done && translationText) {
                  // Streaming partial result
                  setAccumulatedTranslation(prev => {
                    const newAccumulated = prev + translationText;
                    setTranslatedText(newAccumulated);
                    return newAccumulated;
                  });
                } else if (response.done) {
                  // Final result
                  setAccumulatedTranslation(prev => {
                    const finalText = prev + translationText;
                    setTranslatedText(finalText.trim());
                    setIsTranslating(false);
                    Vibration.vibrate(50);
                    return '';
                  });
                }
              } catch (error) {
                console.error('Error processing translation response:', error);
                setTranslatedText('Error processing translation');
                setAccumulatedTranslation('');
                setIsTranslating(false);
              }
            }
            // CURRENT FORMAT: Has done field but no type (assume it's translation)
            else if (response.done !== undefined && !response.type) {
              console.log(
                '✅ Processing legacy translation response (no type)',
              );

              // Clear timeout on successful response
              clearTranslationTimeout();

              try {
                const translationText = response.text || '';

                if (!response.done && translationText) {
                  // Streaming partial result
                  setAccumulatedTranslation(prev => {
                    const newAccumulated = prev + translationText;
                    setTranslatedText(newAccumulated);
                    return newAccumulated;
                  });
                } else if (response.done) {
                  // Final result
                  setAccumulatedTranslation(prev => {
                    const finalText = prev + translationText;
                    setTranslatedText(finalText.trim());
                    setIsTranslating(false);
                    Vibration.vibrate(50);
                    return '';
                  });
                }
              } catch (error) {
                console.error(
                  'Error processing legacy translation response:',
                  error,
                );
                setTranslatedText('Error processing translation');
                setAccumulatedTranslation('');
                setIsTranslating(false);
              }
            }
            // ERROR FORMAT: Has type field with error
            else if (response.type === 'error') {
              console.error('Received error response:', response.errorMessage);
              setTranslatedText(`❌ ${response.errorMessage}`);
              setIsTranslating(false);
              clearTranslationTimeout();
            }
            // IGNORE: Everything else
            else {
              console.log(
                '🚫 Ignoring non-translation response:',
                response.type || 'no-type',
              );
            }
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

    // Set a timeout to handle stuck translations
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

      // Clean prompt for better translation quality
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
        callbacks.onMirrorTranslationUpdate(''); // Clear for loading animation
      } else {
        setTranslatedText(''); // Clear for loading animation
      }

      // Use async method (the new Kotlin module only supports async)
      if (typeof GemmaLLM.generateResponseAsync === 'function') {
        console.log('📤 Using generateResponseAsync (structured format)');

        // Set up listener for mirror mode translations only
        if (isFromMirror) {
          const eventEmitter = new NativeEventEmitter(GemmaLLM);

          const mirrorResponseListener = eventEmitter.addListener(
            'llmResponse',
            response => {
              console.log('=== MIRROR LLM RESPONSE RECEIVED ===');

              if (
                typeof response === 'object' &&
                response.type === 'translation'
              ) {
                console.log(
                  '✅ Mirror: Processing structured translation response',
                );

                // Handle errors
                if (response.error) {
                  console.error(
                    'Mirror translation error:',
                    response.errorMessage,
                  );
                  callbacks.onMirrorTranslationComplete(
                    `❌ ${response.errorMessage}`,
                  );
                  setIsTranslating(false);
                  mirrorResponseListener.remove();
                  clearTranslationTimeout();
                  return;
                }

                // Clear timeout on successful response
                clearTranslationTimeout();

                try {
                  const translationText = response.text || '';

                  if (!response.done && translationText) {
                    // Streaming partial result
                    setAccumulatedTranslation(prev => {
                      const newAccumulated = prev + translationText;
                      callbacks.onMirrorTranslationUpdate(newAccumulated);
                      return newAccumulated;
                    });
                  } else if (response.done) {
                    // Final result
                    setAccumulatedTranslation(prev => {
                      const finalText = prev + translationText;
                      callbacks.onMirrorTranslationComplete(finalText.trim());
                      setIsTranslating(false);
                      Vibration.vibrate(50);
                      mirrorResponseListener.remove();
                      return '';
                    });
                  }
                } catch (error) {
                  console.error('Error processing mirror translation:', error);
                  callbacks.onMirrorTranslationComplete(
                    'Error processing translation',
                  );
                  setAccumulatedTranslation('');
                  setIsTranslating(false);
                  mirrorResponseListener.remove();
                }
              } else if (
                typeof response === 'object' &&
                response.type === 'error'
              ) {
                // Handle error responses
                console.error('Mirror error response:', response.errorMessage);
                callbacks.onMirrorTranslationComplete(
                  `❌ ${response.errorMessage}`,
                );
                setIsTranslating(false);
                mirrorResponseListener.remove();
                clearTranslationTimeout();
              } else {
                // Ignore all other responses
                console.log(
                  '🚫 Mirror: Ignoring non-translation response:',
                  response.type || 'unknown',
                );
              }
            },
          );
        }

        GemmaLLM.generateResponseAsync(prompt);
      } else {
        throw new Error('generateResponseAsync method not available');
      }
    } catch (error) {
      console.error('❌ Translation error:', error);

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

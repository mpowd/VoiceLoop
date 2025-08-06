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
  resetModelContext: () => Promise<void>;
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
  const currentModeRef = useRef<'normal' | 'mirror'>('normal');

  // Setup LLM response listener
  useEffect(() => {
    if (GemmaLLM) {
      eventEmitterRef.current = new NativeEventEmitter(GemmaLLM);

      responseListenerRef.current = eventEmitterRef.current.addListener(
        'llmResponse',
        response => {
          console.log('=== UNIFIED LLM RESPONSE RECEIVED ===');
          console.log('Raw response:', JSON.stringify(response));
          console.log('Current mode:', currentModeRef.current);

          if (typeof response === 'object') {
            if (response.type === 'translation') {
              console.log('✅ Processing structured translation response');

              // Handle errors
              if (response.error) {
                console.error('Translation error:', response.errorMessage);
                let errorMessage = `❌ Translation failed`;

                if (
                  response.errorMessage.includes('maxTokens') ||
                  response.errorMessage.includes('OUT_OF_RANGE') ||
                  response.errorMessage.includes('too long')
                ) {
                  errorMessage = '❌ Translation error - retrying...';
                  console.log(
                    '⚠️ Unexpected context overflow in isolated mode!',
                  );
                }

                if (currentModeRef.current === 'mirror') {
                  callbacks.onMirrorTranslationComplete(errorMessage);
                } else {
                  setTranslatedText(errorMessage);
                }
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
                  if (currentModeRef.current === 'mirror') {
                    setAccumulatedTranslation(prev => {
                      const newAccumulated = prev + translationText;
                      callbacks.onMirrorTranslationUpdate(newAccumulated);
                      return newAccumulated;
                    });
                  } else {
                    setAccumulatedTranslation(prev => {
                      const newAccumulated = prev + translationText;
                      setTranslatedText(newAccumulated);
                      return newAccumulated;
                    });
                  }
                } else if (response.done) {
                  // Final result - clean up the translation
                  if (currentModeRef.current === 'mirror') {
                    setAccumulatedTranslation(prev => {
                      const rawText = (prev + translationText).trim();
                      const cleanedText = cleanTranslationText(rawText);
                      console.log(
                        '🪞 Final mirror translation (cleaned):',
                        cleanedText,
                      );
                      callbacks.onMirrorTranslationComplete(cleanedText);
                      setIsTranslating(false);
                      Vibration.vibrate(50);
                      return '';
                    });
                  } else {
                    setAccumulatedTranslation(prev => {
                      const rawText = (prev + translationText).trim();
                      const cleanedText = cleanTranslationText(rawText);
                      setTranslatedText(cleanedText);
                      setIsTranslating(false);
                      Vibration.vibrate(50);
                      return '';
                    });
                  }
                }
              } catch (error) {
                console.error('Error processing translation response:', error);
                const errorMessage = 'Error processing translation';

                if (currentModeRef.current === 'mirror') {
                  callbacks.onMirrorTranslationComplete(errorMessage);
                } else {
                  setTranslatedText(errorMessage);
                }
                setAccumulatedTranslation('');
                setIsTranslating(false);
              }
            }
            // ERROR FORMAT: Has type field with error
            else if (response.type === 'error') {
              console.error('Received error response:', response.errorMessage);
              let errorMessage = `❌ Translation failed`;

              if (currentModeRef.current === 'mirror') {
                callbacks.onMirrorTranslationComplete(errorMessage);
              } else {
                setTranslatedText(errorMessage);
              }
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
  }, [callbacks]);

  const cleanTranslationText = (text: string): string => {
    if (!text) return text;

    // Remove pronunciation in parentheses (like "(Bason ka station kahaan hai?)")
    let cleaned = text.replace(/\s*\([^)]*\)/g, '');

    // Remove extra whitespace and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove common artifacts
    cleaned = cleaned.replace(/^Translation:\s*/i, '');
    cleaned = cleaned.replace(/^Answer:\s*/i, '');

    return cleaned;
  };

  const resetModelContext = async () => {
    try {
      console.log('🔄 Resetting model context...');

      if (GemmaLLM && typeof GemmaLLM.cleanup === 'function') {
        await GemmaLLM.cleanup();
      }

      // Reload the model
      await callbacks.reloadModel();
      console.log('✅ Model context reset complete');
    } catch (error) {
      console.error('❌ Failed to reset model context:', error);
    }
  };

  // Clear any existing timeout
  const clearTranslationTimeout = () => {
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
      translationTimeoutRef.current = null;
    }
  };

  const translateText = async (
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    isFromMirror = false,
  ) => {
    console.log('🔍 ISOLATED translateText called with:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      isModelReady,
      isFromMirror,
    });

    // Set current mode
    currentModeRef.current = isFromMirror ? 'mirror' : 'normal';
    console.log('📋 Set current mode to:', currentModeRef.current);

    if (!text.trim()) {
      Alert.alert('Error', 'Please enter text to translate');
      return;
    }

    if (!isModelReady) {
      console.log('⚠️ Model not ready yet - isModelReady:', isModelReady);
      Alert.alert('Error', 'Translation engine not ready!');
      return;
    }

    console.log(
      '✅ Starting ISOLATED translation - no context issues possible',
    );
    setIsTranslating(true);

    // Clear previous timeout
    clearTranslationTimeout();

    // Set a timeout to handle stuck translations
    const timeout = setTimeout(() => {
      console.log('⏰ Translation timeout - resetting state');
      setIsTranslating(false);
      const timeoutMessage = '❌ Translation timed out. Please try again.';

      if (currentModeRef.current === 'mirror') {
        callbacks.onMirrorTranslationComplete(timeoutMessage);
      } else {
        setTranslatedText(timeoutMessage);
      }
      setAccumulatedTranslation('');
    }, 20000); // 20 seconds timeout

    translationTimeoutRef.current = timeout;

    try {
      const sourceLanguageName = sourceLanguage.name;
      const targetLanguageName = targetLanguage.name;

      console.log(
        '🔄 Resetting session before translation for complete isolation...',
      );
      if (GemmaLLM && typeof GemmaLLM.resetSession === 'function') {
        await GemmaLLM.resetSession();
      } else {
        console.log(
          '⚠️ resetSession not available, falling back to cleanup...',
        );
        if (GemmaLLM && typeof GemmaLLM.cleanup === 'function') {
          await GemmaLLM.cleanup();
        }
      }

      const prompt = `The following text was generated by speech recognition and may contain errors. Translate from ${sourceLanguageName} to ${targetLanguageName}:

"${text}"

TRANSLATION PROCESS:
1. First, identify and mentally correct any obvious speech recognition errors or typos
2. Understand the overall context and intended meaning
3. For ambiguous words, choose the meaning that best fits the context
4. Translate the corrected and contextualized meaning to ${targetLanguageName}
5. Preserve all specific details (times, dates, numbers) and maintain natural flow

Provide only the accurate ${targetLanguageName} translation:`;

      console.log('🔄 Performing ISOLATED translation:', {
        sourceLanguageName,
        targetLanguageName,
        textLength: text.length,
        isFromMirror,
        currentMode: currentModeRef.current,
        promptLength: prompt.length,
      });

      setAccumulatedTranslation('');
      if (isFromMirror) {
      } else {
        setTranslatedText(''); // Clear for loading animation
      }

      // STEP 3: Generate response with fresh session
      if (typeof GemmaLLM.generateResponseAsync === 'function') {
        console.log(
          '📤 Using generateResponseAsync with fresh isolated session',
        );
        GemmaLLM.generateResponseAsync(prompt);
      } else {
        throw new Error('generateResponseAsync method not available');
      }
    } catch (error) {
      console.error('❌ Isolated translation error:', error);

      let errorMessage = 'Translation error occurred. Please try again.';
      if ((error as Error).message.includes('Async generation failed')) {
        errorMessage = '❌ Translation service error. Please try again.';
      }

      if (currentModeRef.current === 'mirror') {
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
    resetModelContext,
  };
};

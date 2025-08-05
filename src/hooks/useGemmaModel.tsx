import { useState, useEffect } from 'react';
import { Alert, NativeModules, NativeEventEmitter } from 'react-native';

const { GemmaLLM } = NativeModules;

interface GemmaModelHook {
  isModelReady: boolean;
  loadingMessage: string;
  loadGemmaModel: () => Promise<void>;
  cleanup: () => void;
}

export const useGemmaModel = (): GemmaModelHook => {
  const [isModelReady, setIsModelReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Model loading...');

  const loadGemmaModel = async () => {
    try {
      console.log('🤖 Loading Gemma model...');
      setLoadingMessage('🔍 Checking for translation model...');

      // Reset model ready state at the beginning
      setIsModelReady(false);

      // Check if GemmaLLM is available
      if (!GemmaLLM) {
        throw new Error('GemmaLLM Native Module not found');
      }

      // Setup event listeners first
      const eventEmitter = new NativeEventEmitter(GemmaLLM);

      const responseListener = eventEmitter.addListener(
        'llmResponse',
        response => {
          console.log('=== LLM RESPONSE RECEIVED ===');
          console.log('Raw response:', JSON.stringify(response));
          // Note: Response handling will be done in useTranslation hook
        },
      );

      const errorListener = eventEmitter.addListener('llmError', error => {
        console.error('=== LLM ERROR ===');
        console.error('Error:', error);
        // Note: Error handling will be done in useTranslation hook
      });

      // Check model availability first
      setLoadingMessage('🔍 Checking model availability...');

      if (typeof GemmaLLM.checkModelAvailability === 'function') {
        const availability = await GemmaLLM.checkModelAvailability();
        console.log('Model availability:', availability);

        if (availability.availableCount === 0) {
          if (typeof GemmaLLM.getSetupInstructions === 'function') {
            const instructions = await GemmaLLM.getSetupInstructions();
            Alert.alert(
              'Model Setup Required',
              `Translation model not found!\n\n${instructions}`,
            );
          } else {
            Alert.alert(
              'Model Setup Required',
              'Translation model not found! Please install the Gemma model via ADB.',
            );
          }
          return;
        }
      }

      setLoadingMessage('🤖 Loading translation engine...');

      // Initialize the model
      if (typeof GemmaLLM.initializeModel === 'function') {
        const result = await GemmaLLM.initializeModel();
        console.log('Model initialization result:', result);
        console.log('✅ Gemma model loaded successfully');

        setLoadingMessage('✅ Model ready!');
        console.log('🎯 Setting isModelReady = true');
        setIsModelReady(true);
      } else if (typeof GemmaLLM.loadModel === 'function') {
        // Fallback to loadModel if initializeModel doesn't exist
        await GemmaLLM.loadModel();
        console.log('✅ Gemma model loaded successfully');
        setLoadingMessage('✅ Model ready!');
        console.log('🎯 Setting isModelReady = true');
        setIsModelReady(true);
      } else {
        throw new Error('No valid model loading function found');
      }

      // Store listeners for cleanup
      global.gemmaListeners = { responseListener, errorListener };

      // Add a small delay to ensure state is properly set
      setTimeout(() => {
        console.log('🔄 Double-checking isModelReady state');
        setIsModelReady(true);
      }, 100);
    } catch (error) {
      console.error('❌ Failed to load Gemma model:', error);
      setLoadingMessage('❌ Model loading failed');

      // Better error handling - show specific error but don't crash
      let errorMessage = 'Failed to load translation model';
      if ((error as Error).message.includes('not found')) {
        errorMessage = 'GemmaLLM module not properly installed';
      } else if ((error as Error).message.includes('not a function')) {
        errorMessage = 'GemmaLLM module missing required functions';
      }

      Alert.alert(
        'Model Error',
        `${errorMessage}. Please check your setup.\n\nError: ${
          (error as Error).message
        }`,
        [
          { text: 'Retry', onPress: loadGemmaModel },
          {
            text: 'Continue anyway',
            onPress: () => {
              console.log('🎯 Force setting isModelReady = true');
              setIsModelReady(true);
            },
          },
        ],
      );

      // Set a fallback ready state so app doesn't stay on loading screen forever
      setTimeout(() => {
        console.log('🎯 Fallback setting isModelReady = true');
        setIsModelReady(true);
      }, 3000);
    }
  };

  const cleanup = () => {
    // Cleanup event listeners if they exist
    if (global.gemmaListeners) {
      global.gemmaListeners.responseListener?.remove();
      global.gemmaListeners.errorListener?.remove();
    }
  };

  // Initialize on mount
  useEffect(() => {
    loadGemmaModel();
    return cleanup;
  }, []);

  return {
    isModelReady,
    loadingMessage,
    loadGemmaModel,
    cleanup,
  };
};

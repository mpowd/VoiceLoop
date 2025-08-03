import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  NativeModules,
  NativeEventEmitter,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';

const { GemmaLLM } = NativeModules;
const { width } = Dimensions.get('window');

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelInitialized, setIsModelInitialized] = useState<boolean>(false);
  const [inputLanguage, setInputLanguage] = useState<string>('English');
  const [outputLanguage, setOutputLanguage] = useState<string>('German');

  // Animation states
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(GemmaLLM);

    const responseListener = eventEmitter.addListener(
      'llmResponse',
      response => {
        console.log('Translation received:', response);
        setTranslatedText(response.text);
        if (response.done) {
          setIsLoading(false);
          // Subtle success feedback
          Vibration.vibrate(50);
          animateResult();
        }
      },
    );

    const errorListener = eventEmitter.addListener('llmError', error => {
      console.error('Translation Error:', error);
      setIsLoading(false);
      setTranslatedText(`❌ Error: ${error}`);
      Alert.alert('Translation Error', String(error));
      Vibration.vibrate([100, 100, 100]);
    });

    // Auto-initialize model
    initializeModel();

    return () => {
      responseListener.remove();
      errorListener.remove();
    };
  }, []);

  const animateResult = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const initializeModel = async (): Promise<void> => {
    try {
      console.log('Initializing Gemma model...');
      setIsLoading(true);
      setTranslatedText('🔍 Checking for translation model...');

      const availability = await GemmaLLM.checkModelAvailability();
      console.log('Model availability:', availability);

      if (availability.availableCount === 0) {
        const instructions = await GemmaLLM.getSetupInstructions();
        setTranslatedText(`❌ Translation model not found!\n\n${instructions}`);
        Alert.alert(
          'Model Setup Required',
          'Please install the Gemma model via ADB to enable translations.',
        );
        return;
      }

      if (availability.tooLarge) {
        setTranslatedText(
          `⚠️ ${availability.warning}\n\nRecommendation: Use Gemma-3 1B (~529MB) for optimal mobile performance.`,
        );
        Alert.alert('Model Size Warning', availability.warning);
      }

      setTranslatedText('🤖 Loading translation engine...');

      const result = await GemmaLLM.initializeModel();
      console.log('Model initialized:', result);

      setIsModelInitialized(true);
      setTranslatedText(
        `✅ Translation ready!\n\n🌐 Engine: Gemma-3\n📦 Size: ${result.modelSizeMB.toFixed(
          1,
        )} MB\n⚡ Ready in: ${(result.initTimeMs / 1000).toFixed(
          1,
        )}s\n\nType something to translate...`,
      );

      // Animate initial state
      animateResult();
    } catch (error) {
      console.error('Model initialization failed:', error);
      setTranslatedText(`❌ Failed to load translation engine: ${error}`);
      Alert.alert('Initialization Error', `Failed to initialize: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const translateText = async (): Promise<void> => {
    if (!inputText.trim()) {
      Alert.alert('Notice', 'Please enter text to translate!');
      return;
    }

    if (!isModelInitialized) {
      Alert.alert('Error', 'Translation engine not ready!');
      return;
    }

    try {
      console.log('Starting translation...');
      setIsLoading(true);
      setTranslatedText('🔄 Translating...');

      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      // Enhanced translation prompt for better accuracy
      const translationPrompt = `You are a professional translator. Translate the following text from ${inputLanguage} to ${outputLanguage}. 

Guidelines:
- Provide only the translated text, no explanations
- Maintain the original tone and meaning
- Keep proper nouns unchanged unless they have standard translations
- For colloquial expressions, use natural ${outputLanguage} equivalents

Text to translate: "${inputText}"

Translation:`;

      // Use async generation for better UX
      GemmaLLM.generateResponseAsync(translationPrompt);
    } catch (error) {
      console.error('Translation failed:', error);
      setIsLoading(false);
      setTranslatedText(`❌ Translation failed: ${error}`);
      Alert.alert('Translation Error', `Failed to translate: ${error}`);
    }
  };

  const swapLanguages = (): void => {
    const temp = inputLanguage;
    setInputLanguage(outputLanguage);
    setOutputLanguage(temp);

    // Also swap the text content
    const tempText = inputText;
    setInputText(translatedText);
    setTranslatedText(tempText);

    Vibration.vibrate(30);
  };

  const clearAll = (): void => {
    setInputText('');
    setTranslatedText('');
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
  };

  const copyTranslation = (): void => {
    if (translatedText) {
      // Note: In real app, use Clipboard API
      Alert.alert('Copied!', 'Translation copied to clipboard');
      Vibration.vibrate(50);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>VoiceLoop</Text>
          <Text style={styles.headerSubtitle}>Powered by Gemma</Text>
        </View>
        <View style={styles.languageIndicator}>
          <Text style={styles.languageText}>
            {inputLanguage} → {outputLanguage}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Language Selection */}
          <View style={styles.languageSelector}>
            <View style={styles.languageButton}>
              <Text style={styles.languageLabel}>From</Text>
              <Text style={styles.languageValue}>{inputLanguage}</Text>
            </View>

            <TouchableOpacity
              style={styles.swapButton}
              onPress={swapLanguages}
              disabled={isLoading}
            >
              <Text style={styles.swapIcon}>⇄</Text>
            </TouchableOpacity>

            <View style={styles.languageButton}>
              <Text style={styles.languageLabel}>To</Text>
              <Text style={styles.languageValue}>{outputLanguage}</Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Text style={styles.sectionTitle}>Enter Text</Text>
              <Text style={styles.charCount}>{inputText.length}/500</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={`Type in ${inputLanguage}...`}
              placeholderTextColor="#666"
              multiline={true}
              maxLength={500}
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          {/* Translate Button */}
          <TouchableOpacity
            style={[
              styles.translateButton,
              (isLoading || !isModelInitialized) && styles.buttonDisabled,
            ]}
            onPress={translateText}
            disabled={isLoading || !isModelInitialized}
            activeOpacity={0.8}
          >
            <Text style={styles.translateButtonText}>
              {isLoading ? '🔄 Translating...' : '🌐 Translate'}
            </Text>
          </TouchableOpacity>

          {/* Output Section */}
          <Animated.View
            style={[
              styles.outputSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.outputHeader}>
              <Text style={styles.sectionTitle}>Translation</Text>
              {translatedText && !isLoading && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyTranslation}
                >
                  <Text style={styles.copyButtonText}>📋 Copy</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.outputBox}>
              <ScrollView
                style={styles.outputScrollView}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.outputText}>
                  {translatedText || 'Translation will appear here...'}
                </Text>
              </ScrollView>
            </View>
          </Animated.View>

          {/* Control Buttons */}
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlButton} onPress={clearAll}>
              <Text style={styles.controlButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={initializeModel}
              disabled={isLoading}
            >
              <Text style={styles.controlButtonText}>🔄 Reload</Text>
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          {isLoading && (
            <View style={styles.statusContainer}>
              <View style={styles.loadingDot} />
              <Text style={styles.statusText}>
                {isModelInitialized
                  ? 'Processing translation...'
                  : 'Loading model...'}
              </Text>
            </View>
          )}

          {/* Model Status */}
          <View style={styles.modelStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isModelInitialized ? '#4ade80' : '#f87171' },
              ]}
            />
            <Text style={styles.modelStatusText}>
              {isModelInitialized
                ? 'Translation Engine Ready'
                : 'Engine Offline'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  languageIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  languageText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
  },
  languageButton: {
    flex: 1,
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  languageValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  swapIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    backgroundColor: '#1e293b',
    minHeight: 120,
    color: '#ffffff',
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    fontFamily: 'System',
  },
  translateButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  translateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outputSection: {
    marginBottom: 24,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  copyButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  outputBox: {
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 16,
    backgroundColor: '#1e293b',
    minHeight: 120,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outputScrollView: {
    padding: 20,
  },
  outputText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#e2e8f0',
    fontFamily: 'System',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  controlButtonText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 16,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  modelStatusText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default App;

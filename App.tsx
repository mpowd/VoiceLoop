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
  Vibration,
  Modal,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';

const { GemmaLLM } = NativeModules;

// Top 20 most spoken languages worldwide
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', speakers: '1.5B' },
  { code: 'zh', name: 'Chinese', native: '中文', speakers: '1.1B' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speakers: '602M' },
  { code: 'es', name: 'Spanish', native: 'Español', speakers: '559M' },
  { code: 'fr', name: 'French', native: 'Français', speakers: '280M' },
  { code: 'ar', name: 'Arabic', native: 'العربية', speakers: '422M' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speakers: '268M' },
  { code: 'ru', name: 'Russian', native: 'Русский', speakers: '258M' },
  { code: 'pt', name: 'Portuguese', native: 'Português', speakers: '260M' },
  {
    code: 'id',
    name: 'Indonesian',
    native: 'Bahasa Indonesia',
    speakers: '199M',
  },
  { code: 'ur', name: 'Urdu', native: 'اردو', speakers: '170M' },
  { code: 'de', name: 'German', native: 'Deutsch', speakers: '132M' },
  { code: 'ja', name: 'Japanese', native: '日本語', speakers: '125M' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', speakers: '200M' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speakers: '83M' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speakers: '82M' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', speakers: '88M' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speakers: '78M' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', speakers: '85M' },
  { code: 'ko', name: 'Korean', native: '한국어', speakers: '82M' },
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelInitialized, setIsModelInitialized] = useState<boolean>(false);
  const [inputLanguage, setInputLanguage] = useState(LANGUAGES[0]); // English
  const [outputLanguage, setOutputLanguage] = useState(LANGUAGES[11]); // German
  const [showInputLanguageModal, setShowInputLanguageModal] =
    useState<boolean>(false);
  const [showOutputLanguageModal, setShowOutputLanguageModal] =
    useState<boolean>(false);

  // TTS States
  const [isTtsInitialized, setIsTtsInitialized] = useState<boolean>(false);
  const [isSpeakingInput, setIsSpeakingInput] = useState<boolean>(false);
  const [isSpeakingOutput, setIsSpeakingOutput] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  // STT States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasVoicePermission, setHasVoicePermission] = useState<boolean>(false);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState<boolean>(false);
  const [partialSpeechText, setPartialSpeechText] = useState<string>('');

  useEffect(() => {
    console.log('Setting up event listeners...');
    const eventEmitter = new NativeEventEmitter(GemmaLLM);

    const responseListener = eventEmitter.addListener(
      'llmResponse',
      response => {
        console.log('=== LLM RESPONSE RECEIVED ===');
        console.log('Raw response:', JSON.stringify(response));
        console.log('Response type:', typeof response);

        try {
          // Handle different response formats safely
          let translationText = '';
          if (typeof response === 'string') {
            translationText = response;
          } else if (response && response.text) {
            translationText = response.text;
          } else if (response && response.message) {
            translationText = response.message;
          } else {
            translationText = 'Translation received but format unknown';
          }

          // Clean up the translation
          translationText = translationText
            .replace(/^Translation:\s*/i, '')
            .replace(/^Translated text:\s*/i, '')
            .replace(/^Output:\s*/i, '')
            .replace(/\n+$/, '') // Remove trailing newlines
            .trim();

          console.log('Final cleaned translation:', translationText);
          setTranslatedText(translationText);

          // Check if done
          const isDone =
            (response && response.done) || typeof response === 'string';
          console.log('Is done?', isDone);

          if (isDone) {
            setIsLoading(false);
            Vibration.vibrate(50);
          }
        } catch (error) {
          console.error('Error processing response:', error);
          setTranslatedText('Error processing translation');
          setIsLoading(false);
        }
      },
    );

    const errorListener = eventEmitter.addListener('llmError', error => {
      console.error('=== LLM ERROR ===');
      console.error('Error:', error);
      setIsLoading(false);
      setTranslatedText(`❌ Error: ${error}`);
      Alert.alert('Translation Error', String(error));
    });

    // Initialize model, TTS, and Voice
    console.log('Starting initialization...');
    initializeModel();
    initializeTts();
    initializeVoice();
    requestVoicePermission();

    return () => {
      console.log('Cleaning up event listeners...');
      responseListener.remove();
      errorListener.remove();
      cleanupTts();
      cleanupVoice();
    };
  }, []);

  // === VOICE RECOGNITION FUNCTIONS ===
  const initializeVoice = () => {
    try {
      // Voice Event Handlers
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechPartialResults = onSpeechPartialResults;

      // Check if voice is available
      Voice.isAvailable()
        .then(available => {
          setIsVoiceAvailable(available);
          console.log('Voice available:', available);
        })
        .catch(error => {
          console.error('Voice availability check failed:', error);
          setIsVoiceAvailable(false);
        });
    } catch (error) {
      console.error('Voice initialization failed:', error);
      setIsVoiceAvailable(false);
    }
  };

  const cleanupVoice = () => {
    Voice.destroy().then(Voice.removeAllListeners).catch(console.error);
  };

  const requestVoicePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Mikrofon Berechtigung',
            message:
              'Diese App benötigt Zugriff auf das Mikrofon für Spracherkennung.',
            buttonPositive: 'OK',
          },
        );
        setHasVoicePermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn('Voice permission error:', err);
        setHasVoicePermission(false);
      }
    } else {
      setHasVoicePermission(true);
    }
  };

  // Voice Event Handlers
  const onSpeechStart = (e: any) => {
    console.log('Speech started', e);
    setIsRecording(true);
    setPartialSpeechText('');
  };

  const onSpeechEnd = (e: any) => {
    console.log('Speech ended', e);
    setIsRecording(false);
    setPartialSpeechText('');
  };

  const onSpeechResults = (e: any) => {
    console.log('Speech results', e);
    if (e.value && e.value.length > 0) {
      const recognizedText = e.value[0];
      setInputText(recognizedText); // Set the recognized text as input
      setPartialSpeechText('');
      Vibration.vibrate(50); // Feedback für erfolgreiche Erkennung
    }
  };

  const onSpeechPartialResults = (e: any) => {
    console.log('Partial speech results', e);
    if (e.value && e.value.length > 0) {
      setPartialSpeechText(e.value[0]);
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech error', e);
    setIsRecording(false);
    setPartialSpeechText('');

    // Handle different error types silently for better UX
    switch (e.error?.code) {
      case '5':
        console.log('Client-side error - already started');
        break;
      case '6':
        Alert.alert('Fehler', 'Keine Berechtigung für Mikrofon');
        break;
      case '8':
        Alert.alert('Fehler', 'Audio-Aufnahme fehlgeschlagen');
        break;
      default:
        if (
          e.error?.message &&
          !e.error.message.includes('5/Client side error')
        ) {
          console.log('Speech error:', e.error?.message);
        }
    }
  };

  const startVoiceRecognition = async () => {
    if (!hasVoicePermission) {
      Alert.alert('Keine Berechtigung', 'Mikrofon-Zugriff erforderlich');
      return;
    }

    if (!isVoiceAvailable) {
      Alert.alert('Nicht verfügbar', 'Spracherkennung ist nicht verfügbar');
      return;
    }

    if (isRecording) {
      console.log('Already recording, ignoring start request');
      return;
    }

    try {
      setPartialSpeechText('');
      // Use the input language for speech recognition
      const voiceLanguage = getVoiceLanguageCode(inputLanguage.code);
      await Voice.start(voiceLanguage);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsRecording(false);
    }
  };

  const stopVoiceRecognition = async () => {
    if (!isRecording) {
      return;
    }

    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  // Convert language codes to voice recognition format
  const getVoiceLanguageCode = (languageCode: string): string => {
    const voiceLanguageMappings: { [key: string]: string } = {
      en: 'en-US',
      de: 'de-DE',
      es: 'es-ES',
      fr: 'fr-FR',
      it: 'it-IT',
      pt: 'pt-BR',
      ru: 'ru-RU',
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN',
      hi: 'hi-IN',
      ar: 'ar-SA',
      tr: 'tr-TR',
    };
    return voiceLanguageMappings[languageCode] || 'en-US';
  };

  // === EXISTING TTS AND TRANSLATION FUNCTIONS ===
  const initializeTts = async (): Promise<void> => {
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

      if (error.code === 'no_engine') {
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
        Alert.alert('TTS Error', `Failed to initialize TTS: ${error.message}`);
      }
    }
  };

  const cleanupTts = (): void => {
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

  const speakText = async (
    text: string,
    language: string,
    isInput: boolean = false,
  ): Promise<void> => {
    if (!isTtsInitialized) {
      Alert.alert('TTS Error', 'Text-to-Speech not available');
      return;
    }

    if (!text || text.trim().length === 0) {
      Alert.alert('Notice', 'No text to speak');
      return;
    }

    // Clean text for TTS (remove emojis and special characters)
    const cleanText = text
      .replace(/[🔍🤖✅❌🔄🌐🗑️🎤]/g, '')
      .replace(/Engine:\s*Gemma-3[\s\S]*?translate\.\.\./i, 'Translation ready')
      .trim();

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
      const bestVoice = findBestVoice(language);
      if (bestVoice) {
        console.log(`Setting voice for ${language}:`, bestVoice.id);
        await Tts.setDefaultVoice(bestVoice.id);
      }

      // Set language
      await Tts.setDefaultLanguage(language);

      console.log(
        `Speaking text in ${language}: "${cleanText.substring(0, 50)}..."`,
      );

      // Speak the text
      await Tts.speak(cleanText);

      Vibration.vibrate(30);
    } catch (error) {
      console.error('TTS speak error:', error);
      setIsSpeakingInput(false);
      setIsSpeakingOutput(false);
      Alert.alert('TTS Error', `Failed to speak: ${error.message}`);
    }
  };

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

  const stopSpeaking = async (): Promise<void> => {
    try {
      await Tts.stop();
      setIsSpeakingInput(false);
      setIsSpeakingOutput(false);
      console.log('TTS stopped');
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
  };

  const initializeModel = async (): Promise<void> => {
    try {
      console.log('=== MODEL INITIALIZATION START ===');
      setIsLoading(true);
      setTranslatedText('🔍 Checking for translation model...');

      const availability = await GemmaLLM.checkModelAvailability();
      console.log('Model availability:', availability);

      if (availability.availableCount === 0) {
        const instructions = await GemmaLLM.getSetupInstructions();
        setTranslatedText(`❌ Translation model not found!\n\n${instructions}`);
        Alert.alert(
          'Model Setup Required',
          'Please install the Gemma model via ADB.',
        );
        return;
      }

      setTranslatedText('🤖 Loading translation engine...');

      const result = await GemmaLLM.initializeModel();
      console.log('Model initialization result:', result);

      setIsModelInitialized(true);
      setTranslatedText(
        `✅ Translation ready!\n\n🌐 Engine: Gemma-3\n📦 Size: ${result.modelSizeMB.toFixed(
          1,
        )} MB\n\nSelect languages and type or speak something to translate...`,
      );
    } catch (error) {
      console.error('=== MODEL INITIALIZATION ERROR ===');
      console.error('Error:', error);
      setTranslatedText(`❌ Failed to load translation engine: ${error}`);
      Alert.alert('Initialization Error', `Failed to initialize: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const translateText = async (): Promise<void> => {
    if (!inputText.trim()) {
      Alert.alert('Notice', 'Please enter or speak text to translate!');
      return;
    }

    if (!isModelInitialized) {
      Alert.alert('Error', 'Translation engine not ready!');
      return;
    }

    try {
      console.log('=== TRANSLATION START ===');
      console.log(
        `Translating from ${inputLanguage.name} to ${outputLanguage.name}`,
      );
      console.log(`Input text: "${inputText}"`);

      setIsLoading(true);
      setTranslatedText('🔄 Translating...');

      const translationPrompt = `Translate the following text from ${inputLanguage.name} to ${outputLanguage.name}.

Important: Only provide the translated text, nothing else. No explanations, no "Translation:" prefix, no additional commentary.

Text: "${inputText}"`;

      console.log('Sending prompt to LLM...');
      console.log('Prompt:', translationPrompt);

      // Use async generation
      GemmaLLM.generateResponseAsync(translationPrompt);
    } catch (error) {
      console.error('=== TRANSLATION ERROR ===');
      console.error('Error:', error);
      setIsLoading(false);
      setTranslatedText(`❌ Translation failed: ${error}`);
      Alert.alert('Translation Error', `Failed to translate: ${error}`);
    }
  };

  const swapLanguages = (): void => {
    const temp = inputLanguage;
    setInputLanguage(outputLanguage);
    setOutputLanguage(temp);

    // Also swap the text content if both have content
    if (
      inputText &&
      translatedText &&
      !translatedText.includes('❌') &&
      !translatedText.includes('🔄')
    ) {
      const tempText = inputText;
      setInputText(translatedText);
      setTranslatedText(tempText);
    }

    Vibration.vibrate(30);
  };

  const clearAll = (): void => {
    setInputText('');
    setTranslatedText('');
    setPartialSpeechText('');
    stopSpeaking(); // Stop any current speech
  };

  const selectInputLanguage = (language: (typeof LANGUAGES)[0]) => {
    setInputLanguage(language);
    setShowInputLanguageModal(false);
    Vibration.vibrate(30);
  };

  const selectOutputLanguage = (language: (typeof LANGUAGES)[0]) => {
    setOutputLanguage(language);
    setShowOutputLanguageModal(false);
    Vibration.vibrate(30);
  };

  const LanguageModal = ({
    visible,
    onClose,
    onSelect,
    title,
    currentLanguage,
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (language: (typeof LANGUAGES)[0]) => void;
    title: string;
    currentLanguage: (typeof LANGUAGES)[0];
  }) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
          >
            {LANGUAGES.map(language => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage.code === language.code &&
                    styles.languageItemSelected,
                ]}
                onPress={() => onSelect(language)}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNative}>{language.native}</Text>
                </View>
                <View style={styles.languageStats}>
                  <Text style={styles.languageSpeakers}>
                    {language.speakers}
                  </Text>
                  {currentLanguage.code === language.code && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>VoiceLoop</Text>
          <Text style={styles.headerSubtitle}>
            Powered by Gemma • Private & Offline • Voice Enabled
          </Text>
        </View>
        <View style={styles.languageIndicator}>
          <Text style={styles.languageText}>
            {inputLanguage.native} → {outputLanguage.native}
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
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowInputLanguageModal(true)}
              disabled={isLoading}
            >
              <Text style={styles.languageLabel}>From</Text>
              <Text style={styles.languageValue}>{inputLanguage.name}</Text>
              <Text style={styles.languageNativeSmall}>
                {inputLanguage.native}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.swapButton}
              onPress={swapLanguages}
              disabled={isLoading}
            >
              <Text style={styles.swapIcon}>⇄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowOutputLanguageModal(true)}
              disabled={isLoading}
            >
              <Text style={styles.languageLabel}>To</Text>
              <Text style={styles.languageValue}>{outputLanguage.name}</Text>
              <Text style={styles.languageNativeSmall}>
                {outputLanguage.native}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Section with Voice Recognition */}
          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Text style={styles.sectionTitle}>Enter Text</Text>
              <View style={styles.inputHeaderRight}>
                <Text style={styles.charCount}>{inputText.length}/500</Text>

                {/* Voice Recognition Button */}
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isRecording && styles.voiceButtonActive,
                    (!hasVoicePermission || !isVoiceAvailable) &&
                      styles.voiceButtonDisabled,
                  ]}
                  onPressIn={startVoiceRecognition}
                  onPressOut={stopVoiceRecognition}
                  disabled={
                    !hasVoicePermission || !isVoiceAvailable || isLoading
                  }
                >
                  <Text
                    style={[
                      styles.voiceIcon,
                      isRecording && styles.voiceIconActive,
                    ]}
                  >
                    {isRecording ? '🎤' : '🎙️'}
                  </Text>
                </TouchableOpacity>

                {/* Input Text Speaker Button */}
                <TouchableOpacity
                  style={[
                    styles.speakerButton,
                    isSpeakingInput && styles.speakerButtonActive,
                    (!isTtsInitialized || !inputText.trim()) &&
                      styles.speakerButtonDisabled,
                  ]}
                  onPress={() => speakText(inputText, inputLanguage.code, true)}
                  disabled={!isTtsInitialized || !inputText.trim() || isLoading}
                >
                  <Text
                    style={[
                      styles.speakerIcon,
                      isSpeakingInput && styles.speakerIconActive,
                    ]}
                  >
                    {isSpeakingInput ? '🔊' : '🔈'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Speech Recognition Feedback */}
            {(isRecording || partialSpeechText) && (
              <View style={styles.speechFeedback}>
                <Text style={styles.speechFeedbackText}>
                  {isRecording ? '🎤 Listening...' : ''}
                  {partialSpeechText ? ` "${partialSpeechText}"` : ''}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.textInput}
              placeholder={`Type or speak in ${inputLanguage.name}...`}
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
          <View style={styles.outputSection}>
            <View style={styles.outputHeader}>
              <Text style={styles.sectionTitle}>Translation</Text>
              {/* Output Text Speaker Button */}
              <TouchableOpacity
                style={[
                  styles.speakerButton,
                  isSpeakingOutput && styles.speakerButtonActive,
                  (!isTtsInitialized ||
                    !translatedText.trim() ||
                    translatedText.includes('❌') ||
                    translatedText.includes('🔄') ||
                    translatedText.includes('Translation will appear here')) &&
                    styles.speakerButtonDisabled,
                ]}
                onPress={() =>
                  speakText(translatedText, outputLanguage.code, false)
                }
                disabled={
                  !isTtsInitialized ||
                  !translatedText.trim() ||
                  isLoading ||
                  translatedText.includes('❌') ||
                  translatedText.includes('🔄') ||
                  translatedText.includes('Translation will appear here')
                }
              >
                <Text
                  style={[
                    styles.speakerIcon,
                    isSpeakingOutput && styles.speakerIconActive,
                  ]}
                >
                  {isSpeakingOutput ? '🔊' : '🔈'}
                </Text>
              </TouchableOpacity>
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
          </View>

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

            {/* Stop Speaking Button */}
            <TouchableOpacity
              style={[
                styles.controlButton,
                (isSpeakingInput || isSpeakingOutput) &&
                  styles.stopSpeakingButton,
              ]}
              onPress={stopSpeaking}
              disabled={!isSpeakingInput && !isSpeakingOutput}
            >
              <Text style={styles.controlButtonText}>
                {isSpeakingInput || isSpeakingOutput ? '🔇 Stop' : '🔇 Stop'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          {isLoading && (
            <View style={styles.statusContainer}>
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

            {/* TTS Status */}
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isTtsInitialized ? '#4ade80' : '#f87171',
                  marginLeft: 16,
                },
              ]}
            />
            <Text style={styles.modelStatusText}>
              {isTtsInitialized ? 'TTS Ready' : 'TTS Offline'}
            </Text>

            {/* Voice Recognition Status */}
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    hasVoicePermission && isVoiceAvailable
                      ? '#4ade80'
                      : '#f87171',
                  marginLeft: 16,
                },
              ]}
            />
            <Text style={styles.modelStatusText}>
              {hasVoicePermission && isVoiceAvailable
                ? 'Voice Ready'
                : 'Voice Offline'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Selection Modals */}
      <LanguageModal
        visible={showInputLanguageModal}
        onClose={() => setShowInputLanguageModal(false)}
        onSelect={selectInputLanguage}
        title="Select Input Language"
        currentLanguage={inputLanguage}
      />

      <LanguageModal
        visible={showOutputLanguageModal}
        onClose={() => setShowOutputLanguageModal(false)}
        onSelect={selectOutputLanguage}
        title="Select Output Language"
        currentLanguage={outputLanguage}
      />
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
    marginBottom: 2,
  },
  languageNativeSmall: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
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
  inputHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  // Voice Recognition Button Styles
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  voiceButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.1 }],
  },
  voiceButtonDisabled: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    opacity: 0.5,
  },
  voiceIcon: {
    fontSize: 16,
    color: '#d1d5db',
  },
  voiceIconActive: {
    color: '#ffffff',
  },
  // Speech Feedback Styles
  speechFeedback: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  speechFeedbackText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // TTS Speaker Button Styles
  speakerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  speakerButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  speakerButtonDisabled: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    opacity: 0.5,
  },
  speakerIcon: {
    fontSize: 16,
    color: '#d1d5db',
  },
  speakerIconActive: {
    color: '#ffffff',
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
  stopSpeakingButton: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
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
    marginBottom: 16,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  languageList: {
    paddingHorizontal: 24,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  languageStats: {
    alignItems: 'flex-end',
  },
  languageSpeakers: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedCheck: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
});

export default App;

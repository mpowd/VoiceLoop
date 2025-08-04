import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
  Vibration,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

const { GemmaLLM } = NativeModules;

// 40 Most Spoken Languages Worldwide
const languages = [
  { code: 'en-US', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', native: '中文', flag: '🇨🇳' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'ar-SA', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'bn-BD', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'ru-RU', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'pt-PT', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ur-PK', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'de-DE', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja-JP', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'sw-KE', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'tr-TR', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'vi-VN', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko-KR', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'it-IT', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'th-TH', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pl-PL', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'uk-UA', name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  { code: 'my-MM', name: 'Burmese', native: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ro-RO', name: 'Romanian', native: 'Română', flag: '🇷🇴' },
  { code: 'nl-NL', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'hu-HU', name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
  { code: 'cs-CZ', name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  { code: 'el-GR', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he-IL', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
  { code: 'fi-FI', name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  { code: 'sv-SE', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'no-NO', name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
  { code: 'da-DK', name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
];

const LoadingScreen = ({ message = 'Model loading...' }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingContent,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
        <Text style={styles.loadingText}>{message}</Text>
      </Animated.View>
    </View>
  );
};

// Translation Loading Animation Component
const TranslationLoadingAnimation = () => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  return (
    <View style={styles.translationLoadingContainer}>
      <Animated.View
        style={[
          styles.translationLoadingDots,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={[styles.translationDot, styles.translationDot1]} />
        <View style={[styles.translationDot, styles.translationDot2]} />
        <View style={[styles.translationDot, styles.translationDot3]} />
      </Animated.View>
      <Text style={styles.translationLoadingText}>Übersetze...</Text>
    </View>
  );
};

const LanguageSelector = ({
  languages,
  selectedLanguage,
  onSelect,
  title,
  searchQuery,
  onSearchChange,
}) => {
  const filteredLanguages = languages.filter(
    language =>
      language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      language.native.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.languageSelectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      <ScrollView
        style={styles.languageList}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {filteredLanguages.map(language => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageOption,
              selectedLanguage.code === language.code &&
                styles.selectedLanguageOption,
            ]}
            onPress={() => onSelect(language)}
          >
            <Text style={styles.languageFlag}>{language.flag}</Text>
            <View style={styles.languageTextContainer}>
              <Text
                style={[
                  styles.languageName,
                  selectedLanguage.code === language.code &&
                    styles.selectedLanguageName,
                ]}
              >
                {language.name}
              </Text>
              <Text
                style={[
                  styles.languageNative,
                  selectedLanguage.code === language.code &&
                    styles.selectedLanguageNative,
                ]}
              >
                {language.native}
              </Text>
            </View>
            {selectedLanguage.code === language.code && (
              <Text style={styles.selectedCheck}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const MenuModal = ({ visible, onClose }) => {
  const menuItems = [
    {
      id: 'voice',
      icon: '🎤',
      title: 'Voice Mode',
      subtitle: 'Sprechen & Übersetzen',
    },
    {
      id: 'history',
      icon: '📚',
      title: 'History',
      subtitle: 'Übersetzungsverlauf',
    },
    {
      id: 'favorites',
      icon: '⭐',
      title: 'Favorites',
      subtitle: 'Gespeicherte Übersetzungen',
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'Settings',
      subtitle: 'App-Einstellungen',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            {menuItems.map(item => (
              <TouchableOpacity key={item.id} style={styles.menuItem}>
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const VoiceLoopApp = () => {
  const [isModelReady, setIsModelReady] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [accumulatedTranslation, setAccumulatedTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Model loading...');

  // Mirror Mode
  const [isMirrorMode, setIsMirrorMode] = useState(false);

  // Voice/STT States
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // TTS States
  const [isTtsInitialized, setIsTtsInitialized] = useState(false);
  const [isSpeakingInput, setIsSpeakingInput] = useState(false);
  const [isSpeakingOutput, setIsSpeakingOutput] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  // Search states for language selector
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');

  // Translation timeout handler
  const [translationTimeout, setTranslationTimeout] = useState(null);

  const [sourceLanguage, setSourceLanguage] = useState(languages[0]); // English
  const [targetLanguage, setTargetLanguage] = useState(languages[11]); // German

  useEffect(() => {
    initializeApp();
    return () => {
      if (Voice && Voice.destroy) {
        Voice.destroy().catch(console.error);
      }
      cleanupTts();
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      // Cleanup event listeners if they exist
      if (global.gemmaListeners) {
        global.gemmaListeners.responseListener?.remove();
        global.gemmaListeners.errorListener?.remove();
      }
    };
  }, []);

  const initializeApp = async () => {
    await requestAudioPermission();
    await initializeVoice();
    await initializeTts();
    await loadGemmaModel();
  };

  // === TTS FUNCTIONS ===
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
        console.log('TTS initialization failed, but continuing without TTS');
      }
    }
  };

  const cleanupTts = () => {
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

  const speakText = async (text, language, isInput = false) => {
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
      .replace(/[🔍🤖✅❌🔄🌐🗑️🎤⏳]/g, '')
      .replace(/Übersetze\.\.\./g, '')
      .replace(/Translating\.\.\./g, '')
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

      // Set language (convert from our format to TTS format)
      const ttsLanguage = language.includes('-') ? language : language + '-US';
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
      Alert.alert('TTS Error', `Failed to speak: ${error.message}`);
    }
  };

  const findBestVoice = languageCode => {
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

          // Clear timeout on successful response
          if (translationTimeout) {
            clearTimeout(translationTimeout);
            setTranslationTimeout(null);
          }

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
            console.error('Error processing response:', error);
            setTranslatedText('Error processing translation');
            setAccumulatedTranslation('');
            setIsTranslating(false);
          }
        },
      );

      const errorListener = eventEmitter.addListener('llmError', error => {
        console.error('=== LLM ERROR ===');
        console.error('Error:', error);
        setIsTranslating(false);
        setTranslatedText(`❌ Error: ${error}`);
        setAccumulatedTranslation('');

        // Clear timeout on error
        if (translationTimeout) {
          clearTimeout(translationTimeout);
          setTranslationTimeout(null);
        }
      });

      // Check model availability first
      setLoadingMessage('🔍 Checking model availability...');

      if (typeof GemmaLLM.checkModelAvailability === 'function') {
        const availability = await GemmaLLM.checkModelAvailability();
        console.log('Model availability:', availability);

        if (availability.availableCount === 0) {
          if (typeof GemmaLLM.getSetupInstructions === 'function') {
            const instructions = await GemmaLLM.getSetupInstructions();
            setTranslatedText(
              `❌ Translation model not found!\n\n${instructions}`,
            );
          } else {
            setTranslatedText('❌ Translation model not found!');
          }
          Alert.alert(
            'Model Setup Required',
            'Please install the Gemma model via ADB.',
          );
          return;
        }
      }

      setLoadingMessage('🤖 Loading translation engine...');

      // Initialize the model
      if (typeof GemmaLLM.initializeModel === 'function') {
        const result = await GemmaLLM.initializeModel();
        console.log('Model initialization result:', result);
        console.log('✅ Gemma model loaded successfully');

        // Keep translation area clean after model loads
        setTranslatedText('');

        // Also set loading message to success
        setLoadingMessage('✅ Model ready!');

        // IMPORTANT: Set model ready AFTER everything is initialized
        console.log('🎯 Setting isModelReady = true');
        setIsModelReady(true);
      } else if (typeof GemmaLLM.loadModel === 'function') {
        // Fallback to loadModel if initializeModel doesn't exist
        await GemmaLLM.loadModel();
        console.log('✅ Gemma model loaded successfully');
        setTranslatedText('');
        setLoadingMessage('✅ Model ready!');

        // IMPORTANT: Set model ready AFTER everything is initialized
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
      if (error.message.includes('not found')) {
        errorMessage = 'GemmaLLM module not properly installed';
      } else if (error.message.includes('not a function')) {
        errorMessage = 'GemmaLLM module missing required functions';
      }

      Alert.alert(
        'Model Error',
        `${errorMessage}. Please check your setup.\n\nError: ${error.message}`,
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
        setTranslatedText(
          '❌ Translation engine not available. Please check your setup.',
        );
      }, 3000);
    }
  };

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

  const initializeVoice = async () => {
    try {
      Voice.onSpeechStart = () => {
        console.log('🎤 Speech started');
        setIsProcessingVoice(false);
      };

      Voice.onSpeechEnd = () => {
        console.log('🛑 Speech ended - Processing...');
        setIsProcessingVoice(true);
      };

      // Real-time transcription during speech
      Voice.onSpeechPartialResults = async e => {
        console.log('📝 Partial speech results:', e.value);

        if (e.value && e.value.length > 0) {
          const partialText = e.value[0];
          console.log('⏳ Partial text:', partialText);

          // Append to existing text instead of replacing
          setInputText(prev => {
            const existingText = prev.trim();
            if (existingText) {
              return existingText + ' ' + partialText;
            }
            return partialText;
          });
        }
      };

      Voice.onSpeechResults = async e => {
        console.log('📝 Final speech results received:', e.value);

        if (e.value && e.value.length > 0) {
          const spokenText = e.value[0];
          console.log('✅ Final recognized text:', spokenText);

          // Append to existing text instead of replacing
          setInputText(prev => {
            const existingText = prev.trim();
            if (existingText) {
              return existingText + ' ' + spokenText;
            }
            return spokenText;
          });

          Vibration.vibrate(50);
        }

        setIsProcessingVoice(false);
        // Stop automatically after final results
        setIsListening(false);
      };

      Voice.onSpeechError = e => {
        console.log('⚠️ Voice error:', e.error);
        setIsListening(false);
        setIsProcessingVoice(false);

        if (e.error?.code !== '5') {
          console.error('Voice error:', e.error);
        }
      };
    } catch (error) {
      console.error('Voice initialization failed:', error);
    }
  };

  // Toggle function instead of separate start/stop
  const toggleListening = async () => {
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

    if (isProcessingVoice) {
      console.log('⚠️ Still processing, please wait');
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

        await Voice.start(sourceLanguage.code);
        console.log(`✅ Voice.start(${sourceLanguage.code}) successful`);
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Manual translation function - only called when translate button is pressed
  const translateText = async () => {
    const text = inputText.trim();
    console.log('🔍 translateText called with:', {
      text,
      isModelReady,
    });

    if (!text) {
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

    // Set a timeout to handle stuck translations
    const timeout = setTimeout(() => {
      console.log('⏰ Translation timeout - resetting state');
      setIsTranslating(false);
      setTranslatedText('❌ Translation timed out. Please try again.');
      setAccumulatedTranslation('');
    }, 30000); // 30 second timeout

    setTranslationTimeout(timeout);

    try {
      const sourceLanguageName = sourceLanguage.name;
      const targetLanguageName = targetLanguage.name;

      const prompt = `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}.

Important: Only provide the translated text, nothing else. No explanations, no "Translation:" prefix, no additional commentary.

Text: "${text}"`;

      console.log('🔄 Translating with Gemma:', {
        sourceLanguageName,
        targetLanguageName,
        text,
      });

      setAccumulatedTranslation('');
      setTranslatedText(''); // Clear previous translation for loading animation

      // Use async method if available, otherwise fallback to sync
      if (typeof GemmaLLM.generateResponseAsync === 'function') {
        console.log('📤 Using generateResponseAsync');
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

        setTranslatedText(cleanedTranslation);
        setIsTranslating(false);

        // Clear timeout on successful response
        if (translationTimeout) {
          clearTimeout(translationTimeout);
          setTranslationTimeout(null);
        }
      } else {
        throw new Error('No translation method available');
      }
    } catch (error) {
      console.error('❌ Translation error:', error);
      setTranslatedText('Translation error occurred');
      setIsTranslating(false);

      // Clear timeout on error
      if (translationTimeout) {
        clearTimeout(translationTimeout);
        setTranslationTimeout(null);
      }
    }
  };

  // Simple text input handler - no automatic translation
  const handleTextChange = text => {
    setInputText(text);
  };

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);

    const tempText = inputText;
    setInputText(translatedText);
    setTranslatedText(tempText);
  };

  const handleSourceLanguageSelect = language => {
    setSourceLanguage(language);
    setShowSourceSelector(false);
    setSourceSearchQuery('');
  };

  const handleTargetLanguageSelect = language => {
    setTargetLanguage(language);
    setShowTargetSelector(false);
    setTargetSearchQuery('');
  };

  const clearAll = () => {
    setInputText('');
    setTranslatedText('');
    setAccumulatedTranslation('');
    stopSpeaking();
  };

  const toggleMirrorMode = () => {
    setIsMirrorMode(!isMirrorMode);
    Vibration.vibrate(50);
  };

  // Show Loading Screen if model is not ready
  if (!isModelReady) {
    return <LoadingScreen message={loadingMessage} />;
  }

  // Mirror Mode Layout
  if (isMirrorMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mirrorContainer}>
          {/* Top Section (Flipped for Person Across) */}
          <View style={[styles.mirrorSection, styles.mirrorTopSection]}>
            <View style={styles.mirrorContent}>
              {/* Language Label (Flipped) */}
              <View style={[styles.languageLabel, styles.mirrorLanguageLabel]}>
                <TouchableOpacity
                  style={[
                    styles.ttsButton,
                    isSpeakingOutput && styles.ttsButtonActive,
                  ]}
                  onPress={() =>
                    speakText(
                      translatedText,
                      targetLanguage.code.split('-')[0],
                      false,
                    )
                  }
                  disabled={
                    !translatedText ||
                    translatedText.includes('❌') ||
                    isSpeakingOutput
                  }
                >
                  <Text style={styles.ttsButtonIcon}>
                    {isSpeakingOutput ? '🔊' : '🔈'}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.languageLabelText, styles.mirrorText]}>
                  {targetLanguage.flag} {targetLanguage.native}
                </Text>
              </View>

              {/* Translation Display (Flipped) */}
              <ScrollView
                style={styles.mirrorTextArea}
                contentContainerStyle={styles.mirrorTextAreaContent}
              >
                {isTranslating ? (
                  <TranslationLoadingAnimation />
                ) : (
                  <Text style={[styles.translatedText, styles.mirrorText]}>
                    {translatedText || 'Translation appears here...'}
                  </Text>
                )}
              </ScrollView>

              {/* Action Buttons (Flipped) */}
              <View style={[styles.mirrorActionButtons, styles.mirrorFlipped]}>
                <TouchableOpacity
                  style={[
                    styles.mirrorActionButton,
                    styles.translateButton,
                    isTranslating && styles.actionButtonDisabled,
                    !inputText.trim() && styles.actionButtonDisabled,
                  ]}
                  onPress={translateText}
                  disabled={isTranslating || !inputText.trim()}
                >
                  <Text style={styles.actionButtonIcon}>
                    {isTranslating ? '⏳' : '🔄'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mirrorActionButton,
                    styles.voiceButton,
                    isListening && styles.voiceButtonActive,
                    !hasAudioPermission && styles.actionButtonDisabled,
                  ]}
                  onPress={toggleListening}
                  disabled={!hasAudioPermission}
                >
                  <Text style={styles.actionButtonIcon}>
                    {isProcessingVoice ? '⏳' : isListening ? '🔴' : '🎙️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Center Language Bar */}
          <View style={styles.mirrorLanguageBar}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowSourceSelector(true)}
            >
              <Text style={styles.flagText}>{sourceLanguage.flag}</Text>
              <Text style={styles.languageText}>{sourceLanguage.native}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={swapLanguages}
            >
              <Text style={styles.arrowText}>⇅</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowTargetSelector(true)}
            >
              <Text style={styles.flagText}>{targetLanguage.flag}</Text>
              <Text style={styles.languageText}>{targetLanguage.native}</Text>
            </TouchableOpacity>

            {/* Mirror Mode Toggle */}
            <TouchableOpacity
              style={[styles.menuButton, styles.mirrorModeButton]}
              onPress={toggleMirrorMode}
            >
              <Text style={styles.menuButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Section (Normal for User) */}
          <View style={[styles.mirrorSection, styles.mirrorBottomSection]}>
            <View style={styles.mirrorContent}>
              {/* Language Label */}
              <View style={styles.languageLabel}>
                <Text style={styles.languageLabelText}>
                  {sourceLanguage.flag} {sourceLanguage.native}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.ttsButton,
                    isSpeakingInput && styles.ttsButtonActive,
                  ]}
                  onPress={() =>
                    speakText(
                      inputText,
                      sourceLanguage.code.split('-')[0],
                      true,
                    )
                  }
                  disabled={!inputText.trim() || isSpeakingInput}
                >
                  <Text style={styles.ttsButtonIcon}>
                    {isSpeakingInput ? '🔊' : '🔈'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Text Input */}
              <TextInput
                style={styles.mirrorTextInput}
                placeholder="Enter text to translate..."
                placeholderTextColor="#64748b"
                value={inputText}
                onChangeText={handleTextChange}
                multiline={true}
                textAlignVertical="top"
              />

              {/* Action Buttons */}
              <View style={styles.mirrorActionButtons}>
                <TouchableOpacity
                  style={[
                    styles.mirrorActionButton,
                    styles.translateButton,
                    isTranslating && styles.actionButtonDisabled,
                    !inputText.trim() && styles.actionButtonDisabled,
                  ]}
                  onPress={translateText}
                  disabled={isTranslating || !inputText.trim()}
                >
                  <Text style={styles.actionButtonIcon}>
                    {isTranslating ? '⏳' : '🔄'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mirrorActionButton,
                    styles.voiceButton,
                    isListening && styles.voiceButtonActive,
                    !hasAudioPermission && styles.actionButtonDisabled,
                  ]}
                  onPress={toggleListening}
                  disabled={!hasAudioPermission}
                >
                  <Text style={styles.actionButtonIcon}>
                    {isProcessingVoice ? '⏳' : isListening ? '🔴' : '🎙️'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mirrorActionButton, styles.clearButton]}
                  onPress={clearAll}
                >
                  <Text style={styles.actionButtonIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Language Selection Modals */}
        <Modal
          visible={showSourceSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSourceSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSourceSelector(false)}
          >
            <View style={styles.languageSelectorModal}>
              <LanguageSelector
                languages={languages}
                selectedLanguage={sourceLanguage}
                onSelect={handleSourceLanguageSelect}
                title="Choose Source Language"
                searchQuery={sourceSearchQuery}
                onSearchChange={setSourceSearchQuery}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showTargetSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTargetSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTargetSelector(false)}
          >
            <View style={styles.languageSelectorModal}>
              <LanguageSelector
                languages={languages}
                selectedLanguage={targetLanguage}
                onSelect={handleTargetLanguageSelect}
                title="Choose Target Language"
                searchQuery={targetSearchQuery}
                onSearchChange={setTargetSearchQuery}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Stop Speaking Button */}
        {(isSpeakingInput || isSpeakingOutput) && (
          <TouchableOpacity
            style={styles.floatingStopButton}
            onPress={stopSpeaking}
          >
            <Text style={styles.floatingStopButtonText}>🔇 Stop</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // Normal Mode Layout
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Upper Half - Translation Output */}
        <View style={styles.translationSection}>
          <View style={styles.translationContainer}>
            <View style={styles.languageLabel}>
              <Text style={styles.languageLabelText}>
                {targetLanguage.flag} {targetLanguage.native}
              </Text>

              {/* TTS Button for Output */}
              {isTtsInitialized &&
                translatedText &&
                !translatedText.includes('❌') &&
                !translatedText.includes('🔄') &&
                !translatedText.includes('Translation') && (
                  <TouchableOpacity
                    style={[
                      styles.ttsButton,
                      isSpeakingOutput && styles.ttsButtonActive,
                    ]}
                    onPress={() =>
                      speakText(
                        translatedText,
                        targetLanguage.code.split('-')[0],
                        false,
                      )
                    }
                    disabled={isSpeakingOutput}
                  >
                    <Text style={styles.ttsButtonIcon}>
                      {isSpeakingOutput ? '🔊' : '🔈'}
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
            <ScrollView
              style={styles.textArea}
              contentContainerStyle={styles.textAreaContent}
            >
              {isTranslating ? (
                <TranslationLoadingAnimation />
              ) : (
                <Text style={styles.translatedText}>
                  {translatedText || 'Übersetzung erscheint hier...'}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Middle Bar - Language Selection */}
        <View style={styles.languageBar}>
          {/* Source Language */}
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowSourceSelector(true)}
          >
            <Text style={styles.flagText}>{sourceLanguage.flag}</Text>
            <Text style={styles.languageText}>{sourceLanguage.native}</Text>
          </TouchableOpacity>

          {/* Arrow */}
          <TouchableOpacity style={styles.arrowButton} onPress={swapLanguages}>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>

          {/* Target Language */}
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowTargetSelector(true)}
          >
            <Text style={styles.flagText}>{targetLanguage.flag}</Text>
            <Text style={styles.languageText}>{targetLanguage.native}</Text>
          </TouchableOpacity>

          {/* Mirror Mode Toggle */}
          <TouchableOpacity
            style={[styles.menuButton, styles.mirrorModeButton]}
            onPress={toggleMirrorMode}
          >
            <Text style={styles.menuButtonText}>👥</Text>
          </TouchableOpacity>

          {/* Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Lower Half - Text Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <View style={styles.languageLabel}>
              <Text style={styles.languageLabelText}>
                {sourceLanguage.flag} {sourceLanguage.native}
              </Text>

              {/* TTS Button for Input */}
              {isTtsInitialized && inputText.trim() && (
                <TouchableOpacity
                  style={[
                    styles.ttsButton,
                    isSpeakingInput && styles.ttsButtonActive,
                  ]}
                  onPress={() =>
                    speakText(
                      inputText,
                      sourceLanguage.code.split('-')[0],
                      true,
                    )
                  }
                  disabled={isSpeakingInput}
                >
                  <Text style={styles.ttsButtonIcon}>
                    {isSpeakingInput ? '🔊' : '🔈'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Text zum Übersetzen eingeben..."
                placeholderTextColor="#64748b"
                value={inputText}
                onChangeText={handleTextChange}
                multiline={true}
                textAlignVertical="top"
              />

              {/* Button Container - Stacked vertically */}
              <View style={styles.buttonContainer}>
                {/* Translate Button */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.translateButton,
                    isTranslating && styles.actionButtonDisabled,
                    !inputText.trim() && styles.actionButtonDisabled,
                  ]}
                  onPress={translateText}
                  disabled={isTranslating || !inputText.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonIcon}>
                    {isTranslating ? '⏳' : '🔄'}
                  </Text>
                </TouchableOpacity>

                {/* Voice Input Button */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.voiceButton,
                    isListening && styles.voiceButtonActive,
                    isProcessingVoice && styles.voiceButtonProcessing,
                    !hasAudioPermission && styles.actionButtonDisabled,
                  ]}
                  onPress={toggleListening}
                  disabled={!hasAudioPermission}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonIcon}>
                    {isProcessingVoice ? '⏳' : isListening ? '🔴' : '🎙️'}
                  </Text>
                </TouchableOpacity>

                {/* Clear Button */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.clearButton]}
                  onPress={clearAll}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Language Selection Modals */}
        <Modal
          visible={showSourceSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSourceSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSourceSelector(false)}
          >
            <View style={styles.languageSelectorModal}>
              <LanguageSelector
                languages={languages}
                selectedLanguage={sourceLanguage}
                onSelect={handleSourceLanguageSelect}
                title="Ausgangssprache wählen"
                searchQuery={sourceSearchQuery}
                onSearchChange={setSourceSearchQuery}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showTargetSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTargetSelector(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTargetSelector(false)}
          >
            <View style={styles.languageSelectorModal}>
              <LanguageSelector
                languages={languages}
                selectedLanguage={targetLanguage}
                onSelect={handleTargetLanguageSelect}
                title="Zielsprache wählen"
                searchQuery={targetSearchQuery}
                onSearchChange={setTargetSearchQuery}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Menu Modal */}
        <MenuModal visible={showMenu} onClose={() => setShowMenu(false)} />

        {/* Stop Speaking Button (floating if speaking) */}
        {(isSpeakingInput || isSpeakingOutput) && (
          <TouchableOpacity
            style={styles.floatingStopButton}
            onPress={stopSpeaking}
          >
            <Text style={styles.floatingStopButtonText}>🔇 Stop</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },

  // LOADING SCREEN STYLES
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#64748b',
    marginHorizontal: 4,
  },

  dot1: {
    backgroundColor: '#3b82f6',
  },

  dot2: {
    backgroundColor: '#8b5cf6',
  },

  dot3: {
    backgroundColor: '#06b6d4',
  },

  loadingText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // TRANSLATION LOADING ANIMATION
  translationLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  translationLoadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  translationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748b',
    marginHorizontal: 3,
  },

  translationDot1: {
    backgroundColor: '#3b82f6',
  },

  translationDot2: {
    backgroundColor: '#8b5cf6',
  },

  translationDot3: {
    backgroundColor: '#06b6d4',
  },

  translationLoadingText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // MIRROR MODE STYLES
  mirrorContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },

  mirrorSection: {
    flex: 1,
    padding: 16,
  },

  mirrorTopSection: {
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },

  mirrorBottomSection: {
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },

  mirrorContent: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
  },

  mirrorLanguageLabel: {
    transform: [{ rotate: '180deg' }],
  },

  mirrorText: {
    transform: [{ rotate: '180deg' }],
  },

  mirrorTextArea: {
    flex: 1,
    transform: [{ rotate: '180deg' }],
  },

  mirrorTextAreaContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  mirrorTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },

  mirrorActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
  },

  mirrorFlipped: {
    transform: [{ rotate: '180deg' }],
  },

  mirrorActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  mirrorLanguageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#374151',
    minHeight: 60,
  },

  mirrorModeButton: {
    backgroundColor: '#8b5cf6',
    marginLeft: 8,
  },

  // MAIN LAYOUT
  translationSection: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },

  inputSection: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
  },

  // LANGUAGE BAR (CENTER)
  languageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#374151',
  },

  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#374151',
    minWidth: 80,
  },

  flagText: {
    fontSize: 20,
    marginRight: 8,
  },

  languageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  arrowButton: {
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },

  arrowText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  menuButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },

  menuButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },

  // TEXT AREAS
  translationContainer: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
  },

  inputContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },

  inputRow: {
    flex: 1,
    flexDirection: 'row',
  },

  languageLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  languageLabelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },

  textArea: {
    flex: 1,
  },

  textAreaContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  translatedText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },

  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
    marginRight: 16,
  },

  // TTS BUTTON STYLES
  ttsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ttsButtonActive: {
    backgroundColor: '#3b82f6',
  },

  ttsButtonIcon: {
    fontSize: 16,
    color: '#ffffff',
  },

  // BUTTON CONTAINER - Stacked vertically
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  // SHARED ACTION BUTTON STYLES
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  actionButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },

  actionButtonIcon: {
    fontSize: 24,
  },

  // TRANSLATE BUTTON SPECIFIC
  translateButton: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
  },

  // VOICE BUTTON SPECIFIC
  voiceButton: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },

  voiceButtonActive: {
    backgroundColor: '#ef4444',
    shadowOpacity: 0.5,
    transform: [{ scale: 1.05 }],
  },

  voiceButtonProcessing: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },

  // CLEAR BUTTON SPECIFIC
  clearButton: {
    backgroundColor: '#6b7280',
    shadowColor: '#6b7280',
  },

  // FLOATING STOP BUTTON
  floatingStopButton: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  floatingStopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // LANGUAGE SELECTOR MODAL
  languageSelectorModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    width: '90%',
    height: '80%',
    paddingVertical: 20,
  },

  languageSelectorContainer: {
    flex: 1,
  },

  selectorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  // SEARCH FUNCTIONALITY
  searchContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 16,
  },

  searchInput: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 40,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },

  searchIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    fontSize: 18,
  },

  languageList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#16213e',
  },

  selectedLanguageOption: {
    backgroundColor: '#3b82f6',
  },

  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },

  languageTextContainer: {
    flex: 1,
  },

  languageName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  selectedLanguageName: {
    color: '#ffffff',
  },

  languageNative: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },

  selectedLanguageNative: {
    color: '#e0f2fe',
  },

  selectedCheck: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },

  // MENU MODAL
  menuContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    width: '85%',
    maxHeight: '60%',
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },

  menuTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  closeButton: {
    padding: 4,
  },

  closeButtonText: {
    color: '#94a3b8',
    fontSize: 24,
    fontWeight: 'bold',
  },

  menuItems: {
    paddingVertical: 8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },

  menuItemIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },

  menuItemText: {
    flex: 1,
  },

  menuItemTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  menuItemSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
});

export default VoiceLoopApp;

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  NativeModules,
  PermissionsAndroid,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import Voice from '@react-native-voice/voice';

const { GemmaLLM } = NativeModules;

const LoadingScreen = () => {
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
        <Text style={styles.loadingText}>Model loading...</Text>
      </Animated.View>
    </View>
  );
};

const App = () => {
  // Core States
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false); // Geändert zu false

  // Language Setup (German ↔ French)
  const [bottomLanguage] = useState({
    code: 'de-DE',
    name: 'German',
    native: 'Deutsch',
    flag: '🇩🇪',
  });
  const [topLanguage] = useState({
    code: 'fr-FR',
    name: 'French',
    native: 'Français',
    flag: '🇫🇷',
  });

  // Speech States - VERBESSERTE LOGIK
  const [isListeningBottom, setIsListeningBottom] = useState(false);
  const [isListeningTop, setIsListeningTop] = useState(false);
  const [currentRecordingSide, setCurrentRecordingSide] = useState(null); // Welche Seite gerade aufnimmt
  const [isProcessingResults, setIsProcessingResults] = useState(false); // Verhindert mehrfache Verarbeitung
  const [isWaitingForTranslation, setIsWaitingForTranslation] = useState(false); // Beide Buttons deaktiviert während Übersetzung

  const [bottomOriginal, setBottomOriginal] = useState('');
  const [bottomTranslation, setBottomTranslation] = useState('');
  const [topOriginal, setTopOriginal] = useState('');
  const [topTranslation, setTopTranslation] = useState('');

  useEffect(() => {
    initializeApp();
    return () => {
      Voice.destroy();
    };
  }, []);

  const initializeApp = async () => {
    // Mock Model Loading - 2 Sekunden warten
    setTimeout(() => {
      setIsModelReady(true);
    }, 2000);

    await requestAudioPermission();
    await initializeVoice();
  };

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        setHasAudioPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
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
      };

      Voice.onSpeechEnd = () => {
        console.log('🛑 Speech ended - Warten auf Ergebnisse...');
        // WICHTIG: Hier NICHT die States zurücksetzen, da Ergebnisse noch kommen
        // Aber UI sofort aktualisieren falls noch am "Hört zu..."
        if (isListeningBottom) {
          setBottomOriginal('⏳ Verarbeite...');
        }
        if (isListeningTop) {
          setTopOriginal('⏳ Verarbeite...');
        }

        // Listening-States zurücksetzen aber currentRecordingSide behalten!
        setIsListeningBottom(false);
        setIsListeningTop(false);
      };

      Voice.onSpeechResults = async e => {
        console.log('📝 Speech results received:', e.value);
        console.log(
          '🔍 Debug - currentRecordingSide beim Empfang:',
          currentRecordingSide,
        );

        // Verhindere mehrfache Verarbeitung
        if (isProcessingResults) {
          console.log('⚠️ Bereits am Verarbeiten, ignoriere diese Ergebnisse');
          return;
        }

        setIsProcessingResults(true);

        if (e.value && e.value.length > 0) {
          const spokenText = e.value[0];
          console.log('✅ Erkannter Text:', spokenText);

          // Verwende currentRecordingSide für Zuordnung
          if (currentRecordingSide === 'bottom') {
            console.log('🇩🇪 Deutsche Seite hat gesprochen:', spokenText);
            setBottomOriginal(spokenText);
            setTopTranslation('🔄 Übersetze...');
          } else if (currentRecordingSide === 'top') {
            console.log('🇫🇷 Französische Seite hat gesprochen:', spokenText);
            setTopOriginal(spokenText);
            setBottomTranslation('🔄 Übersetze...');
          } else {
            console.log(
              '❌ currentRecordingSide ist null! Fallback auf bottom',
            );
            setBottomOriginal(spokenText);
            setTopTranslation('🔄 Übersetze...');
          }

          // Simuliere Übersetzungszeit und zeige dann Ergebnis
          setTimeout(() => {
            if (currentRecordingSide === 'bottom') {
              setTopTranslation(`Bonjour! Je traduis: "${spokenText}"`);
            } else if (currentRecordingSide === 'top') {
              setBottomTranslation(`Hallo! Ich übersetze: "${spokenText}"`);
            } else {
              // Fallback
              setTopTranslation(`Bonjour! Je traduis: "${spokenText}"`);
            }

            // Nach Übersetzung: Alles freigeben
            console.log(
              '✅ Übersetzung abgeschlossen - Buttons wieder aktiviert',
            );
            setIsWaitingForTranslation(false);
            setCurrentRecordingSide(null);
            setIsProcessingResults(false);

            Vibration.vibrate([100, 50, 100]); // Doppelte Vibration für "fertig"
          }, 1500); // 1.5 Sekunden Übersetzungszeit

          Vibration.vibrate(50);
        } else {
          // Kein Text erkannt - sofort freigeben
          console.log('❌ Kein Text erkannt - freigeben');
          setIsWaitingForTranslation(false);
          setCurrentRecordingSide(null);
          setIsProcessingResults(false);
        }
      };

      Voice.onSpeechError = e => {
        console.log('⚠️ Voice error:', e.error);

        // Cleanup bei Fehlern
        setIsListeningBottom(false);
        setIsListeningTop(false);
        setCurrentRecordingSide(null);
        setIsProcessingResults(false);
        setIsWaitingForTranslation(false); // Auch bei Fehlern freigeben

        if (e.error?.code !== '5') {
          console.error('Echter Voice-Fehler:', e.error);
        }
      };
    } catch (error) {
      console.error('Voice-Initialisierung fehlgeschlagen:', error);
    }
  };

  const startListening = async side => {
    console.log(`🚀 startListening aufgerufen für Seite: ${side}`);

    if (!hasAudioPermission) {
      Alert.alert('Nicht bereit', 'Mikrofon-Berechtigung erforderlich');
      return;
    }

    // Verhindere Start wenn bereits am Hören, Verarbeiten oder Übersetzen
    if (
      isListeningBottom ||
      isListeningTop ||
      isProcessingResults ||
      isWaitingForTranslation
    ) {
      console.log('⚠️ Bereits am Hören, Verarbeiten oder Übersetzen');
      return;
    }

    try {
      const languageCode =
        side === 'bottom' ? bottomLanguage.code : topLanguage.code;

      console.log(`🎯 Starte ${side}-Seite mit Sprache: ${languageCode}`);

      // WICHTIG: Zuerst die aufnehmende Seite festlegen
      setCurrentRecordingSide(side);

      if (side === 'bottom') {
        setIsListeningBottom(true);
        setBottomOriginal('🎤 Hört zu...');
        setTopTranslation(''); // Lösche alte Übersetzung
      } else {
        setIsListeningTop(true);
        setTopOriginal('🎤 Hört zu...');
        setBottomTranslation(''); // Lösche alte Übersetzung
      }

      await Voice.start(languageCode);
      console.log(`✅ Voice.start(${languageCode}) erfolgreich`);
    } catch (error) {
      console.error('Fehler beim Starten der Aufnahme:', error);
      // Cleanup bei Fehler
      setIsListeningBottom(false);
      setIsListeningTop(false);
      setCurrentRecordingSide(null);
      setIsWaitingForTranslation(false);
    }
  };

  const stopListening = async () => {
    console.log('🛑 stopListening aufgerufen - Button losgelassen');

    // Nur stoppen wenn tatsächlich am Hören
    if (!isListeningBottom && !isListeningTop) {
      console.log('⚠️ Nicht am Hören, nichts zu stoppen');
      return;
    }

    try {
      console.log('🔄 Stoppe Voice Recognition...');
      await Voice.stop();
      console.log('✅ Voice.stop() erfolgreich');

      // WICHTIG: Beide Buttons sofort deaktivieren während Verarbeitung
      setIsWaitingForTranslation(true);
      console.log('🔒 Beide Buttons deaktiviert - warte auf Verarbeitung');

      // UI wird in onSpeechEnd aktualisiert, nicht hier
    } catch (error) {
      console.error('❌ Fehler beim Stoppen:', error);
      // Bei Fehler alles zurücksetzen
      setIsListeningBottom(false);
      setIsListeningTop(false);
      setCurrentRecordingSide(null);
      setIsWaitingForTranslation(false);
    }
  };

  const clearAll = () => {
    // Nur löschen wenn nicht gerade verarbeitet wird
    if (isWaitingForTranslation || isProcessingResults) {
      console.log('⚠️ Kann nicht löschen während Verarbeitung läuft');
      return;
    }

    setBottomOriginal('');
    setBottomTranslation('');
    setTopOriginal('');
    setTopTranslation('');
    setCurrentRecordingSide(null);
  };

  // Zeige Loading Screen wenn Model nicht bereit ist
  if (!isModelReady) {
    return <LoadingScreen />;
  }

  const isReady = hasAudioPermission && !isWaitingForTranslation;
  const isAnyListening = isListeningBottom || isListeningTop;

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP HALF - French (Rotated 180°) */}
      <View style={[styles.half, styles.topHalf]}>
        <View style={styles.rotatedContainer}>
          {/* French Hold-to-Talk Button */}
          <TouchableOpacity
            style={[
              styles.edgeButton,
              styles.leftEdgeButton,
              isListeningTop && styles.edgeButtonActive,
              !isReady && styles.edgeButtonDisabled,
            ]}
            onPressIn={() => isReady && startListening('top')}
            onPressOut={stopListening}
            disabled={!isReady || isWaitingForTranslation}
            activeOpacity={0.8}
          >
            <Text style={styles.edgeButtonIcon}>
              {isListeningTop ? '🎤' : isWaitingForTranslation ? '⏳' : '🔴'}
            </Text>
            <Text style={styles.edgeButtonLabel}>
              {isWaitingForTranslation ? 'WAIT' : 'HOLD'}
            </Text>
          </TouchableOpacity>

          {/* French Text Area */}
          <View style={styles.textContainer}>
            <Text style={styles.languageHeader}>
              {topLanguage.flag} {topLanguage.native}
            </Text>

            <View style={styles.textContent}>
              <View style={styles.originalTextArea}>
                <Text style={styles.textLabel}>Original:</Text>
                <Text style={styles.originalText}>
                  {topOriginal || 'Button halten und sprechen...'}
                </Text>
              </View>

              <View style={styles.translationTextArea}>
                <Text style={styles.textLabel}>Übersetzung:</Text>
                <Text style={styles.translationText}>
                  {topTranslation || 'Übersetzung erscheint hier...'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* CENTER DIVIDER */}
      <View style={styles.centerDivider}>
        <View style={styles.dividerLine} />

        <View style={styles.centerControls}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isReady
                  ? '#10b981'
                  : isWaitingForTranslation
                  ? '#f59e0b'
                  : '#ef4444',
              },
            ]}
          />

          {/* Status Info */}
          <Text style={styles.debugText}>
            {isWaitingForTranslation
              ? 'Übersetze...'
              : currentRecordingSide
              ? `Rec: ${currentRecordingSide}`
              : 'Ready'}
          </Text>

          {(bottomOriginal ||
            topOriginal ||
            bottomTranslation ||
            topTranslation) &&
            !isWaitingForTranslation && (
              <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
                <Text style={styles.clearButtonText}>×</Text>
              </TouchableOpacity>
            )}
        </View>

        <View style={styles.dividerLine} />
      </View>

      {/* BOTTOM HALF - German */}
      <View style={[styles.half, styles.bottomHalf]}>
        {/* German Hold-to-Talk Button */}
        <TouchableOpacity
          style={[
            styles.edgeButton,
            styles.rightEdgeButton,
            isListeningBottom && styles.edgeButtonActive,
            !isReady && styles.edgeButtonDisabled,
          ]}
          onPressIn={() => isReady && startListening('bottom')}
          onPressOut={stopListening}
          disabled={!isReady || isWaitingForTranslation}
          activeOpacity={0.8}
        >
          <Text style={styles.edgeButtonIcon}>
            {isListeningBottom ? '🎤' : isWaitingForTranslation ? '⏳' : '🔴'}
          </Text>
          <Text style={styles.edgeButtonLabel}>
            {isWaitingForTranslation ? 'WAIT' : 'HOLD'}
          </Text>
        </TouchableOpacity>

        {/* German Text Area */}
        <View style={styles.textContainer}>
          <Text style={styles.languageHeader}>
            {bottomLanguage.flag} {bottomLanguage.native}
          </Text>

          <View style={styles.textContent}>
            <View style={styles.originalTextArea}>
              <Text style={styles.textLabel}>Original:</Text>
              <Text style={styles.originalText}>
                {bottomOriginal || 'Button halten und sprechen...'}
              </Text>
            </View>

            <View style={styles.translationTextArea}>
              <Text style={styles.textLabel}>Übersetzung:</Text>
              <Text style={styles.translationText}>
                {bottomTranslation || 'Übersetzung erscheint hier...'}
              </Text>
            </View>
          </View>
        </View>
      </View>
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
  },

  // HALF LAYOUTS
  half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  topHalf: {
    backgroundColor: '#1a1a2e',
  },

  bottomHalf: {
    backgroundColor: '#16213e',
  },

  // TOP HALF ROTATION CONTAINER
  rotatedContainer: {
    flex: 1,
    transform: [{ rotate: '180deg' }],
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // EDGE BUTTONS
  edgeButton: {
    width: 80,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  leftEdgeButton: {
    // Left side when rotated
  },

  rightEdgeButton: {
    // Right side in normal view
  },

  edgeButtonActive: {
    backgroundColor: '#ef4444',
    shadowOpacity: 0.5,
    transform: [{ scale: 1.05 }],
  },

  edgeButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },

  edgeButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  edgeButtonLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    transform: [{ rotate: '90deg' }],
  },

  // TEXT CONTAINERS
  textContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },

  languageHeader: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },

  textContent: {
    flex: 1,
    justifyContent: 'center',
  },

  originalTextArea: {
    marginBottom: 32,
  },

  translationTextArea: {
    marginBottom: 16,
  },

  textLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  originalText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
    minHeight: 56,
  },

  translationText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    minHeight: 48,
  },

  // CENTER DIVIDER
  centerDivider: {
    height: 60,
    backgroundColor: '#0f0f23',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#374151',
  },

  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  debugText: {
    color: '#64748b',
    fontSize: 10,
    marginRight: 8,
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;

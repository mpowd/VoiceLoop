import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';

import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [isTtsInitialized, setIsTtsInitialized] = useState(false);
  const [recognizedHistory, setRecognizedHistory] = useState<string[]>([]);

  useEffect(() => {
    initializeVoice();
    initializeTts();
    requestPermission();

    return () => {
      cleanupVoice();
    };
  }, []);

  const initializeVoice = () => {
    // Voice Event Handlers
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
  };

  const initializeTts = () => {
    Tts.setDefaultLanguage('de-DE');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);

    Tts.getInitStatus()
      .then(() => {
        setIsTtsInitialized(true);
        console.log('TTS initialized successfully');
      })
      .catch(err => {
        console.warn('TTS initialization failed:', err);
        setIsTtsInitialized(false);
      });
  };

  const cleanupVoice = () => {
    Voice.destroy().then(Voice.removeAllListeners).catch(console.error);
  };

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Mikrofon Berechtigung',
            message: 'Diese App benötigt Zugriff auf das Mikrofon.',
            buttonPositive: 'OK',
          },
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
      }
    } else {
      setHasPermission(true);
    }
  };

  const onSpeechStart = (e: any) => {
    console.log('Speech started', e);
    setIsRecording(true);
  };

  const onSpeechEnd = (e: any) => {
    console.log('Speech ended', e);
    setIsRecording(false);
  };

  const onSpeechRecognized = (e: any) => {
    console.log('Speech recognized', e);
  };

  const onSpeechPartialResults = (e: any) => {
    console.log('Partial results', e);
    // Hier könnten Sie Live-Updates anzeigen
  };

  const onSpeechResults = (e: any) => {
    console.log('Speech results', e);
    if (e.value && e.value.length > 0) {
      const newText = e.value[0];
      setSpeechText(newText);

      // Zur Historie hinzufügen
      setRecognizedHistory(prev => [newText, ...prev.slice(0, 9)]); // Letzten 10 behalten
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech error', e);
    setIsRecording(false);

    // Verschiedene Fehlertypen behandeln
    switch (e.error?.code) {
      case '5':
        console.log('Client-side error - möglicherweise bereits gestartet');
        break;
      case '6':
        console.log('Insufficient permissions');
        Alert.alert('Fehler', 'Keine Berechtigung für Mikrofon');
        break;
      case '7':
        console.log('No network connection');
        // Dieser Fehler sollte bei offline Nutzung nicht auftreten
        break;
      case '8':
        console.log('Audio recording error');
        Alert.alert('Fehler', 'Audio-Aufnahme fehlgeschlagen');
        break;
      case '9':
        console.log('Server sends error status');
        break;
      default:
        console.log('Other error:', e.error?.message);
    }
  };

  const startListening = async () => {
    if (!hasPermission) {
      Alert.alert('Keine Berechtigung', 'Mikrofon-Zugriff erforderlich');
      return;
    }

    if (isRecording) {
      console.log('Already recording, ignoring start request');
      return;
    }

    try {
      setSpeechText('');
      setIsRecording(true);
      await Voice.start('de-DE');
    } catch (error) {
      console.error('Error starting voice:', error);
      setIsRecording(false);
      Alert.alert('Fehler', 'Spracherkennung konnte nicht gestartet werden');
    }
  };

  const stopListening = async () => {
    if (!isRecording) {
      return;
    }

    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice:', error);
    }
  };

  const speakText = async (text: string) => {
    if (!isTtsInitialized) {
      Alert.alert(
        'TTS nicht verfügbar',
        'Text-to-Speech ist nicht initialisiert',
      );
      return;
    }

    if (!text.trim()) {
      Alert.alert('Kein Text', 'Bitte sprechen Sie zuerst etwas');
      return;
    }

    try {
      await Tts.speak(text);
    } catch (error) {
      console.error('TTS Error:', error);
      Alert.alert('TTS Fehler', 'Text konnte nicht vorgelesen werden');
    }
  };

  const clearHistory = () => {
    setRecognizedHistory([]);
    setSpeechText('');
  };

  const stopTts = () => {
    Tts.stop();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice + TTS App</Text>

      {/* Status Anzeige */}
      <View style={styles.statusContainer}>
        <Text style={styles.status}>
          🎤 Berechtigung: {hasPermission ? '✅' : '❌'}
        </Text>
        <Text style={styles.status}>
          🔊 TTS: {isTtsInitialized ? '✅' : '❌'}
        </Text>
        <Text style={styles.status}>
          Status: {isRecording ? 'Hört zu...' : 'Bereit'}
        </Text>
      </View>

      {/* Voice Recognition Button */}
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonActive : {},
          !hasPermission ? styles.buttonDisabled : {},
        ]}
        onPressIn={startListening}
        onPressOut={stopListening}
        disabled={!hasPermission}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🎤 HÖRE ZU' : '🎤 DRÜCKEN & HALTEN'}
        </Text>
      </TouchableOpacity>

      {/* Aktueller Text */}
      <View style={styles.resultContainer}>
        <Text style={styles.label}>Aktuell erkannter Text:</Text>
        <Text style={styles.result}>
          {speechText || 'Noch nichts erkannt...'}
        </Text>
      </View>

      {/* TTS Buttons */}
      {speechText && (
        <View style={styles.ttsContainer}>
          <TouchableOpacity
            style={[styles.ttsButton, styles.speakButton]}
            onPress={() => speakText(speechText)}
            disabled={!isTtsInitialized}
          >
            <Text style={styles.ttsButtonText}>🔊 Text vorlesen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ttsButton, styles.stopButton]}
            onPress={stopTts}
          >
            <Text style={styles.ttsButtonText}>⏹️ Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Historie */}
      {recognizedHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Historie:</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearButton}>🗑️ Löschen</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.historyScroll}>
            {recognizedHistory.map((text, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => speakText(text)}
              >
                <Text style={styles.historyText}>
                  {index + 1}. {text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    margin: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  status: {
    fontSize: 14,
    textAlign: 'center',
    margin: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 50,
    margin: 20,
    alignSelf: 'center',
    minWidth: 200,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#F44336',
    transform: [{ scale: 1.1 }],
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    minHeight: 80,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  result: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  ttsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  ttsButton: {
    padding: 15,
    borderRadius: 25,
    flex: 0.45,
    elevation: 3,
  },
  speakButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF9800',
  },
  ttsButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyScroll: {
    maxHeight: 200,
  },
  historyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  historyText: {
    fontSize: 14,
    color: '#333',
  },
});

export default App;

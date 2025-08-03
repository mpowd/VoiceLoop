import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  NativeModules,
} from 'react-native';

const { GemmaLLM } = NativeModules;

const App: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const checkModel = async () => {
    try {
      setStatus('Checking...');
      const result = await GemmaLLM.checkModelAvailability();
      setStatus(`Model: ${result.sizeMB}MB ${result.exists ? '✅' : '❌'}`);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const loadModel = async () => {
    try {
      setIsLoading(true);
      setStatus('Loading large model...');
      const result = await GemmaLLM.initializeModel();
      setStatus(
        `Loaded: ${result.modelSizeMB}MB in ${(
          result.initTimeMs / 1000
        ).toFixed(1)}s`,
      );
      Alert.alert('Success', 'Large model loaded!');
    } catch (error) {
      setStatus(`Failed: ${error.message || error}`);
      Alert.alert('Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testModel = async () => {
    try {
      setIsLoading(true);
      const response = await GemmaLLM.generateResponse('Say hello in German');
      Alert.alert('Test Result', response);
    } catch (error) {
      Alert.alert('Test Failed', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gemma Large Model Test</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkModel}>
        <Text style={styles.buttonText}>Check Model</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.loadButton]}
        onPress={loadModel}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : 'Load Large Model'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={testModel}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Generation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  loadButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;

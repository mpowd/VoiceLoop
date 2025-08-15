import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ChatSettings } from '../types';

interface ChatSettingsModalProps {
  visible: boolean;
  settings: ChatSettings;
  onClose: () => void;
  onSave: (settings: ChatSettings) => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  visible,
  settings,
  onClose,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

  const handleSave = () => {
    // Validate settings
    if (localSettings.systemPrompt.trim().length > 2000) {
      Alert.alert('Error', 'System prompt is too long (max 2000 characters)');
      return;
    }

    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setLocalSettings({
              systemPrompt: '',
            });
          },
        },
      ],
    );
  };

  const presetPrompts = [
    {
      name: 'Math Teacher (3rd Grade)',
      prompt:
        'Du bist ein erfahrener Lehrer einer dritten Grundschulklasse für das Fach "Mathematik". Stelle dem Schüler Aufgaben und gib ihm Feedback zu seinen Lösungen. Sei stets freundlich und versuche ihn zu motivieren. Antworte in maximal drei Sätzen, außer wenn der Schüler eine detailierte Antwort haben möchte.',
    },
    {
      name: 'Language Tutor',
      prompt:
        'Du bist ein geduldiger Sprachlehrer. Hilf dem Nutzer dabei, seine Sprachkenntnisse zu verbessern. Korrigiere Fehler freundlich und erkläre Grammatikregeln verständlich.',
    },
    {
      name: 'Code Reviewer',
      prompt:
        'Du bist ein erfahrener Softwareentwickler. Analysiere Code, gib konstruktives Feedback und schlage Verbesserungen vor. Erkläre deine Empfehlungen verständlich.',
    },
    {
      name: 'Creative Writer',
      prompt:
        'Du bist ein kreativer Schreibassistent. Hilf beim Brainstorming, entwickle Ideen weiter und unterstütze beim Verfassen von Texten aller Art.',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat Settings</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.saveButton]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* System Prompt Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Prompt</Text>
            <Text style={styles.sectionDescription}>
              Define how the AI should behave and respond. This sets the
              personality and role of the assistant.
            </Text>

            <TextInput
              style={styles.textArea}
              value={localSettings.systemPrompt}
              onChangeText={text =>
                setLocalSettings(prev => ({ ...prev, systemPrompt: text }))
              }
              placeholder="Enter a system prompt to define the AI's behavior..."
              placeholderTextColor="#6b7280"
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />

            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {localSettings.systemPrompt.length}/2000
              </Text>
            </View>
          </View>

          {/* Preset Prompts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preset Prompts</Text>
            <Text style={styles.sectionDescription}>
              Choose from predefined prompts or use them as inspiration.
            </Text>

            {presetPrompts.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetItem}
                onPress={() =>
                  setLocalSettings(prev => ({
                    ...prev,
                    systemPrompt: preset.prompt,
                  }))
                }
              >
                <Text style={styles.presetName}>{preset.name}</Text>
                <Text style={styles.presetPrompt} numberOfLines={2}>
                  {preset.prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reset Button */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#16213e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  saveButton: {
    color: '#3b82f6',
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top' as const,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  characterCount: {
    alignItems: 'flex-end' as const,
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#6b7280',
  },
  presetItem: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  presetPrompt: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  numberInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 16,
    width: 80,
    textAlign: 'center' as const,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  resetButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export default ChatSettingsModal;

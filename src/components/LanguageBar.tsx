import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Language } from '../types';
import { languageBarStyles } from '../styles/components';

interface LanguageBarProps {
  sourceLanguage: Language;
  targetLanguage: Language;
  isMirrorMode?: boolean;
  isChatMode?: boolean;
  onSourceLanguagePress: () => void;
  onTargetLanguagePress: () => void;
  onSwapLanguages: () => void;
  onMirrorModeToggle: () => void;
  onChatModeToggle?: () => void;
}

const LanguageBar: React.FC<LanguageBarProps> = ({
  sourceLanguage,
  targetLanguage,
  isMirrorMode = false,
  isChatMode = false,
  onSourceLanguagePress,
  onTargetLanguagePress,
  onSwapLanguages,
  onMirrorModeToggle,
  onChatModeToggle,
}) => {
  // Chat Mode Layout - komplett andere Ansicht
  if (isChatMode) {
    return (
      <View style={languageBarStyles.container}>
        {/* Back to Translation Button (Links) */}
        <TouchableOpacity
          style={[
            languageBarStyles.menuButton,
            languageBarStyles.mirrorModeButton,
          ]}
          onPress={onChatModeToggle}
        >
          <Text style={languageBarStyles.menuButtonText}>←</Text>
        </TouchableOpacity>

        {/* Chat Mode Indicator (Mitte) */}
        <View style={languageBarStyles.languagePairContainer}>
          <View
            style={[
              languageBarStyles.languageButton,
              { flex: 1, alignItems: 'center' },
            ]}
          >
            <Text style={[languageBarStyles.flagText, { fontSize: 24 }]}>
              💬
            </Text>
            <Text style={languageBarStyles.languageText}>Chat Assistant</Text>
          </View>
        </View>

        {/* Placeholder (Rechts) */}
        <View
          style={[
            languageBarStyles.menuButton,
            languageBarStyles.mirrorModeButton,
            { opacity: 0 },
          ]}
        >
          <Text style={languageBarStyles.menuButtonText}> </Text>
        </View>
      </View>
    );
  }

  // Normal Translation Mode Layout
  return (
    <View style={languageBarStyles.container}>
      {/* Mirror Mode Toggle (Links) */}
      <TouchableOpacity
        style={[
          languageBarStyles.menuButton,
          languageBarStyles.mirrorModeButton,
        ]}
        onPress={onMirrorModeToggle}
      >
        <Text style={languageBarStyles.menuButtonText}>
          {isMirrorMode ? '🪞' : '👥'}
        </Text>
      </TouchableOpacity>

      {/* Language Pair (Mitte) */}
      <View style={languageBarStyles.languagePairContainer}>
        {/* Source Language */}
        <TouchableOpacity
          style={languageBarStyles.languageButton}
          onPress={onSourceLanguagePress}
        >
          <Text style={languageBarStyles.flagText}>{sourceLanguage.flag}</Text>
          <Text style={languageBarStyles.languageText}>
            {sourceLanguage.native}
          </Text>
        </TouchableOpacity>

        {/* Arrow */}
        <TouchableOpacity
          style={languageBarStyles.arrowButton}
          onPress={onSwapLanguages}
        >
          <Text style={languageBarStyles.arrowText}>
            {isMirrorMode ? '⇅' : '→'}
          </Text>
        </TouchableOpacity>

        {/* Target Language */}
        <TouchableOpacity
          style={languageBarStyles.languageButton}
          onPress={onTargetLanguagePress}
        >
          <Text style={languageBarStyles.flagText}>{targetLanguage.flag}</Text>
          <Text style={languageBarStyles.languageText}>
            {targetLanguage.native}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat Mode Button (Rechts) - ersetzt Settings Button */}
      <TouchableOpacity
        style={[
          languageBarStyles.menuButton,
          languageBarStyles.mirrorModeButton,
        ]}
        onPress={onChatModeToggle}
      >
        <Text style={languageBarStyles.menuButtonText}>💬</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LanguageBar;

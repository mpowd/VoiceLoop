import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Language } from '../types';
import { languageBarStyles } from '../styles/components';

interface LanguageBarProps {
  sourceLanguage: Language;
  targetLanguage: Language;
  isMirrorMode?: boolean;
  onSourceLanguagePress: () => void;
  onTargetLanguagePress: () => void;
  onSwapLanguages: () => void;
  onMirrorModeToggle: () => void;
}

const LanguageBar: React.FC<LanguageBarProps> = ({
  sourceLanguage,
  targetLanguage,
  isMirrorMode = false,
  onSourceLanguagePress,
  onTargetLanguagePress,
  onSwapLanguages,
  onMirrorModeToggle,
}) => {
  return (
    <View style={languageBarStyles.container}>
      {/* Mirror Mode Toggle (Left) */}
      <TouchableOpacity
        style={[
          languageBarStyles.menuButton,
          languageBarStyles.mirrorModeButton,
        ]}
        onPress={onMirrorModeToggle}
      >
        <Text style={languageBarStyles.menuButtonText}>👥</Text>
      </TouchableOpacity>

      {/* Language Pair (Center) */}
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
    </View>
  );
};

export default LanguageBar;

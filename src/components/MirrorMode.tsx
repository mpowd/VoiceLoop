import React from 'react';
import { SafeAreaView, View, TouchableOpacity, Text } from 'react-native';
import { Language } from '../types';
import { layoutStyles } from '../styles/components';
import TextArea from './TextArea';
import ActionButtons from './ActionButtons';
import LanguageBar from './LanguageBar';
import LanguageSelector from './LanguageSelector';
import { languages } from '../utils/languages';

interface MirrorModeProps {
  // Languages
  sourceLanguage: Language;
  targetLanguage: Language;

  // Translation
  mirrorInputText: string;
  mirrorTranslatedText: string;
  isTranslating: boolean;

  // Voice
  isMirrorListening: boolean;
  isMirrorProcessingVoice: boolean;
  hasAudioPermission: boolean;

  // TTS
  isTtsInitialized: boolean;
  isSpeakingInput: boolean;
  isSpeakingOutput: boolean;

  // UI State
  showSourceSelector: boolean;
  showTargetSelector: boolean;
  sourceSearchQuery: string;
  targetSearchQuery: string;

  // Actions
  onMirrorInputTextChange: (text: string) => void;
  onMirrorTranslate: () => void;
  onMirrorVoiceToggle: () => void;
  onSpeakMirrorInput: () => void;
  onSpeakMirrorOutput: () => void;
  onStopSpeaking: () => void;
  onClearAll: () => void;

  // Language Actions
  onSourceLanguageSelect: (language: Language) => void;
  onTargetLanguageSelect: (language: Language) => void;
  onSwapLanguages: () => void;

  // UI Actions
  onMirrorModeToggle: () => void;
  onMenuToggle: () => void;
  onShowSourceSelector: (show: boolean) => void;
  onShowTargetSelector: (show: boolean) => void;
  onSourceSearchChange: (query: string) => void;
  onTargetSearchChange: (query: string) => void;
}

const MirrorMode: React.FC<MirrorModeProps> = ({
  // Languages
  sourceLanguage,
  targetLanguage,

  // Translation
  mirrorInputText,
  mirrorTranslatedText,
  isTranslating,

  // Voice
  isMirrorListening,
  isMirrorProcessingVoice,
  hasAudioPermission,

  // TTS
  isTtsInitialized,
  isSpeakingInput,
  isSpeakingOutput,

  // UI State
  showSourceSelector,
  showTargetSelector,
  sourceSearchQuery,
  targetSearchQuery,

  // Actions
  onMirrorInputTextChange,
  onMirrorTranslate,
  onMirrorVoiceToggle,
  onSpeakMirrorInput,
  onSpeakMirrorOutput,
  onStopSpeaking,
  onClearAll,

  // Language Actions
  onSourceLanguageSelect,
  onTargetLanguageSelect,
  onSwapLanguages,

  // UI Actions
  onMirrorModeToggle,
  onMenuToggle,
  onShowSourceSelector,
  onShowTargetSelector,
  onSourceSearchChange,
  onTargetSearchChange,
}) => {
  return (
    <SafeAreaView style={layoutStyles.container}>
      <View style={mirrorStyles.container}>
        {/* Top Section (Flipped for Person Across) */}
        <View style={[layoutStyles.section, mirrorStyles.topSection]}>
          <TextArea
            language={sourceLanguage}
            text={mirrorTranslatedText}
            isTranslating={isTranslating}
            canSpeak={isTtsInitialized}
            isSpeaking={isSpeakingOutput}
            onSpeak={onSpeakMirrorOutput}
            isMirror={true}
          />

          {/* Flipped Action Buttons */}
          <ActionButtons
            isTranslating={isTranslating}
            isListening={isMirrorListening}
            isProcessingVoice={isMirrorProcessingVoice}
            hasAudioPermission={hasAudioPermission}
            hasText={!!mirrorInputText.trim()}
            onTranslate={onMirrorTranslate}
            onVoiceToggle={onMirrorVoiceToggle}
            onClear={onClearAll}
            isVertical={false}
            isMirror={true}
          />
        </View>

        {/* Center Language Bar */}
        <LanguageBar
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          isMirrorMode={true}
          onSourceLanguagePress={() => onShowSourceSelector(true)}
          onTargetLanguagePress={() => onShowTargetSelector(true)}
          onSwapLanguages={onSwapLanguages}
          onMirrorModeToggle={onMirrorModeToggle}
          onMenuPress={onMenuToggle}
        />

        {/* Bottom Section (Normal for User) */}
        <View style={[layoutStyles.section, mirrorStyles.bottomSection]}>
          <TextArea
            language={targetLanguage}
            text={mirrorInputText}
            placeholder="Enter text to translate..."
            isEditable={true}
            canSpeak={isTtsInitialized}
            isSpeaking={isSpeakingInput}
            onTextChange={onMirrorInputTextChange}
            onSpeak={onSpeakMirrorInput}
          />

          {/* Normal Action Buttons */}
          <ActionButtons
            isTranslating={isTranslating}
            isListening={isMirrorListening}
            isProcessingVoice={isMirrorProcessingVoice}
            hasAudioPermission={hasAudioPermission}
            hasText={!!mirrorInputText.trim()}
            onTranslate={onMirrorTranslate}
            onVoiceToggle={onMirrorVoiceToggle}
            onClear={onClearAll}
            isVertical={false}
          />
        </View>

        {/* Language Selection Modals */}
        <LanguageSelector
          visible={showSourceSelector}
          languages={languages}
          selectedLanguage={sourceLanguage}
          title="Choose Source Language"
          searchQuery={sourceSearchQuery}
          onSelect={language => {
            onSourceLanguageSelect(language);
            onShowSourceSelector(false);
            onSourceSearchChange('');
          }}
          onClose={() => onShowSourceSelector(false)}
          onSearchChange={onSourceSearchChange}
        />

        <LanguageSelector
          visible={showTargetSelector}
          languages={languages}
          selectedLanguage={targetLanguage}
          title="Choose Target Language"
          searchQuery={targetSearchQuery}
          onSelect={language => {
            onTargetLanguageSelect(language);
            onShowTargetSelector(false);
            onTargetSearchChange('');
          }}
          onClose={() => onShowTargetSelector(false)}
          onSearchChange={onTargetSearchChange}
        />

        {/* Stop Speaking Button */}
        {(isSpeakingInput || isSpeakingOutput) && (
          <TouchableOpacity
            style={layoutStyles.floatingStopButton}
            onPress={onStopSpeaking}
          >
            <Text style={layoutStyles.floatingStopButtonText}>🔇 Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// Mirror-specific styles
const mirrorStyles = {
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  topSection: {
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  bottomSection: {
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
};

export default MirrorMode;

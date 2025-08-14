import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Language } from '../types';
import { layoutStyles } from '../styles/components';
import TextArea from './TextArea';
import ActionButtons from './ActionButtons';
import LanguageBar from './LanguageBar';
import LanguageSelector from './LanguageSelector';
import MenuModal from './MenuModal';
import { languages } from '../utils/languages';

interface NormalModeProps {
  // Languages
  sourceLanguage: Language;
  targetLanguage: Language;

  // Translation
  inputText: string;
  translatedText: string;
  isTranslating: boolean;

  // Voice
  isListening: boolean;
  isProcessingVoice: boolean;
  hasAudioPermission: boolean;

  // TTS
  isTtsInitialized: boolean;
  isSpeakingInput: boolean;
  isSpeakingOutput: boolean;

  // UI State
  showMenu: boolean;
  showSourceSelector: boolean;
  showTargetSelector: boolean;
  sourceSearchQuery: string;
  targetSearchQuery: string;

  // Actions
  onInputTextChange: (text: string) => void;
  onTranslate: () => void;
  onVoiceToggle: () => void;
  onSpeakInput: () => void;
  onSpeakOutput: () => void;
  onStopSpeaking: () => void;
  onClearAll: () => void;

  // Language Actions
  onSourceLanguageSelect: (language: Language) => void;
  onTargetLanguageSelect: (language: Language) => void;
  onSwapLanguages: () => void;

  // UI Actions
  onMirrorModeToggle: () => void;
  onChatModeToggle: () => void; // <-- Diese prop hinzugefügt
  onMenuToggle: () => void;
  onCloseMenu: () => void;
  onShowSourceSelector: (show: boolean) => void;
  onShowTargetSelector: (show: boolean) => void;
  onSourceSearchChange: (query: string) => void;
  onTargetSearchChange: (query: string) => void;
}

const NormalMode: React.FC<NormalModeProps> = ({
  // Languages
  sourceLanguage,
  targetLanguage,

  // Translation
  inputText,
  translatedText,
  isTranslating,

  // Voice
  isListening,
  isProcessingVoice,
  hasAudioPermission,

  // TTS
  isTtsInitialized,
  isSpeakingInput,
  isSpeakingOutput,

  // UI State
  showMenu,
  showSourceSelector,
  showTargetSelector,
  sourceSearchQuery,
  targetSearchQuery,

  // Actions
  onInputTextChange,
  onTranslate,
  onVoiceToggle,
  onSpeakInput,
  onSpeakOutput,
  onStopSpeaking,
  onClearAll,

  // Language Actions
  onSourceLanguageSelect,
  onTargetLanguageSelect,
  onSwapLanguages,

  // UI Actions
  onMirrorModeToggle,
  onChatModeToggle, // <-- Diese prop hinzugefügt
  onMenuToggle,
  onCloseMenu,
  onShowSourceSelector,
  onShowTargetSelector,
  onSourceSearchChange,
  onTargetSearchChange,
}) => {
  return (
    <SafeAreaView style={layoutStyles.container}>
      <KeyboardAvoidingView
        style={layoutStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Upper Half - Translation Output */}
        <View style={[layoutStyles.section, layoutStyles.translationSection]}>
          <TextArea
            language={targetLanguage}
            text={translatedText}
            isTranslating={isTranslating}
            canSpeak={isTtsInitialized}
            isSpeaking={isSpeakingOutput}
            onSpeak={onSpeakOutput}
          />
        </View>

        {/* Middle Bar - Language Selection */}
        <LanguageBar
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguagePress={() => onShowSourceSelector(true)}
          onTargetLanguagePress={() => onShowTargetSelector(true)}
          onSwapLanguages={onSwapLanguages}
          onMirrorModeToggle={onMirrorModeToggle}
          onChatModeToggle={onChatModeToggle}
        />

        {/* Lower Half - Text Input */}
        <View style={[layoutStyles.section, layoutStyles.inputSection]}>
          <View style={layoutStyles.inputRow}>
            <TextArea
              language={sourceLanguage}
              text={inputText}
              placeholder="Enter text to translate..."
              isEditable={true}
              canSpeak={isTtsInitialized}
              isSpeaking={isSpeakingInput}
              onTextChange={onInputTextChange}
              onSpeak={onSpeakInput}
            />

            {/* Action Buttons */}
            <View style={layoutStyles.buttonContainer}>
              <ActionButtons
                isTranslating={isTranslating}
                isListening={isListening}
                isProcessingVoice={isProcessingVoice}
                hasAudioPermission={hasAudioPermission}
                hasText={!!inputText.trim()}
                onTranslate={onTranslate}
                onVoiceToggle={onVoiceToggle}
                onClear={onClearAll}
                isVertical={true}
              />
            </View>
          </View>
        </View>

        {/* Language Selection Modals */}
        <LanguageSelector
          visible={showSourceSelector}
          languages={languages}
          selectedLanguage={sourceLanguage}
          title="Select Source Language"
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
          title="Select Target Language"
          searchQuery={targetSearchQuery}
          onSelect={language => {
            onTargetLanguageSelect(language);
            onShowTargetSelector(false);
            onTargetSearchChange('');
          }}
          onClose={() => onShowTargetSelector(false)}
          onSearchChange={onTargetSearchChange}
        />

        {/* Menu Modal */}
        <MenuModal visible={showMenu} onClose={onCloseMenu} />

        {/* Stop Speaking Button (floating if speaking) */}
        {(isSpeakingInput || isSpeakingOutput) && (
          <TouchableOpacity
            style={layoutStyles.floatingStopButton}
            onPress={onStopSpeaking}
          >
            <Text style={layoutStyles.floatingStopButtonText}>🔇 Stop</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NormalMode;

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
  sourceLanguage: Language;
  targetLanguage: Language;

  sourceText: string;
  targetText: string;
  lastTranslationDirection: 'source-to-target' | 'target-to-source' | null;
  isTranslating: boolean;

  isMirrorListening: boolean; // Target language (top)
  isMirrorProcessingVoice: boolean; // Target language (top)
  isListening: boolean; // Source language (bottom)
  isProcessingVoice: boolean; // Source language (bottom)
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
  onSourceTextChange: (text: string) => void;
  onTargetTextChange: (text: string) => void;
  onTranslateSource: () => void;
  onTranslateTarget: () => void;
  onSourceVoiceToggle: () => void;
  onTargetVoiceToggle: () => void;
  onSpeakSource: () => void;
  onSpeakTarget: () => void;
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
  sourceText,
  targetText,
  lastTranslationDirection,
  isTranslating,

  // Voice
  isMirrorListening, // Target language (top)
  isMirrorProcessingVoice, // Target language (top)
  isListening, // Source language (bottom)
  isProcessingVoice, // Source language (bottom)
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

  // Actions - language-agnostic
  onSourceTextChange,
  onTargetTextChange,
  onTranslateSource,
  onTranslateTarget,
  onSourceVoiceToggle,
  onTargetVoiceToggle,
  onSpeakSource,
  onSpeakTarget,
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
  // Local state for view toggles
  const [partnerViewMode, setPartnerViewMode] = React.useState<
    'input' | 'result'
  >('input');
  const [userViewMode, setUserViewMode] = React.useState<'input' | 'result'>(
    'input',
  );

  // Auto-switch to result view when translation completes
  React.useEffect(() => {
    if (lastTranslationDirection && !isTranslating) {
      if (lastTranslationDirection === 'source-to-target') {
        // Source was translated to target → show target result on top (partner side)
        setPartnerViewMode('result');
        // Keep user in input mode to continue source input
        setUserViewMode('input');
      } else if (lastTranslationDirection === 'target-to-source') {
        // Target was translated to source → show source result on bottom (user side)
        setUserViewMode('result');
        // Keep partner in input mode to continue target input
        setPartnerViewMode('input');
      }
    }
  }, [lastTranslationDirection, isTranslating]);

  // Custom toggle switch component
  const ToggleSwitch = ({
    value,
    onToggle,
    isMirror = false,
  }: {
    value: 'input' | 'result';
    onToggle: (mode: 'input' | 'result') => void;
    isMirror?: boolean;
  }) => (
    <View
      style={[
        mirrorStyles.toggleContainer,
        isMirror && mirrorStyles.mirrorToggle,
      ]}
    >
      <TouchableOpacity
        style={[
          mirrorStyles.toggleOption,
          value === 'input' && mirrorStyles.toggleOptionActive,
        ]}
        onPress={() => onToggle('input')}
      >
        <Text
          style={[
            mirrorStyles.toggleIcon,
            value === 'input' && mirrorStyles.toggleIconActive,
          ]}
        >
          ✏️
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          mirrorStyles.toggleOption,
          value === 'result' && mirrorStyles.toggleOptionActive,
        ]}
        onPress={() => onToggle('result')}
      >
        <Text
          style={[
            mirrorStyles.toggleIcon,
            value === 'result' && mirrorStyles.toggleIconActive,
          ]}
        >
          📄
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={mirrorStyles.container}>
      <View style={mirrorStyles.mainContainer}>
        {/* Top Section (Partner's side - Target Language) - 180° rotated */}
        <View style={[mirrorStyles.topSection, mirrorStyles.rotatedSection]}>
          {/* Toggle Switch for Partner */}
          <ToggleSwitch
            value={partnerViewMode}
            onToggle={setPartnerViewMode}
            isMirror={true}
          />

          <View style={mirrorStyles.contentRow}>
            {/* TextArea for Target Language (partner side) */}
            {partnerViewMode === 'input' ? (
              <TextArea
                language={targetLanguage}
                text={targetText}
                placeholder={`Enter ${targetLanguage.name} text...`}
                isEditable={true}
                canSpeak={isTtsInitialized}
                isSpeaking={isSpeakingInput}
                onTextChange={onTargetTextChange}
                onSpeak={onSpeakTarget}
                isMirror={true}
              />
            ) : (
              <TextArea
                language={targetLanguage}
                text={
                  lastTranslationDirection === 'source-to-target'
                    ? targetText
                    : ''
                }
                isTranslating={
                  isTranslating &&
                  lastTranslationDirection === 'source-to-target'
                }
                canSpeak={isTtsInitialized}
                isSpeaking={isSpeakingOutput}
                onSpeak={onSpeakTarget}
                isMirror={true}
              />
            )}

            {/* Action buttons for Target Language */}
            <View style={mirrorStyles.actionButtonsContainer}>
              <ActionButtons
                isTranslating={isTranslating}
                isListening={isMirrorListening}
                isProcessingVoice={isMirrorProcessingVoice}
                hasAudioPermission={hasAudioPermission}
                hasText={!!targetText.trim()}
                onTranslate={onTranslateTarget}
                onVoiceToggle={onTargetVoiceToggle}
                onClear={onClearAll}
                isVertical={true}
                isMirror={true}
              />
            </View>
          </View>
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

        {/* Bottom Section (User's side - Source Language) */}
        <View style={mirrorStyles.bottomSection}>
          {/* Toggle Switch for User */}
          <ToggleSwitch value={userViewMode} onToggle={setUserViewMode} />

          <View style={mirrorStyles.contentRow}>
            {/* TextArea for Source Language (user side) */}
            {userViewMode === 'input' ? (
              <TextArea
                language={sourceLanguage}
                text={sourceText}
                placeholder={`Enter ${sourceLanguage.name} text...`}
                isEditable={true}
                canSpeak={isTtsInitialized}
                isSpeaking={isSpeakingInput}
                onTextChange={onSourceTextChange}
                onSpeak={onSpeakSource}
              />
            ) : (
              <TextArea
                language={sourceLanguage}
                text={
                  lastTranslationDirection === 'target-to-source'
                    ? sourceText
                    : ''
                }
                isTranslating={
                  isTranslating &&
                  lastTranslationDirection === 'target-to-source'
                }
                canSpeak={isTtsInitialized}
                isSpeaking={isSpeakingOutput}
                onSpeak={onSpeakSource}
              />
            )}

            {/* Action buttons for Source Language */}
            <View style={mirrorStyles.actionButtonsContainer}>
              <ActionButtons
                isTranslating={isTranslating}
                isListening={isListening}
                isProcessingVoice={isProcessingVoice}
                hasAudioPermission={hasAudioPermission}
                hasText={!!sourceText.trim()}
                onTranslate={onTranslateSource}
                onVoiceToggle={onSourceVoiceToggle}
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
            style={mirrorStyles.floatingStopButton}
            onPress={onStopSpeaking}
          >
            <Text style={mirrorStyles.floatingStopButtonText}>🔇 Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// Minimalistic Mirror-specific styles
const mirrorStyles = {
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  mainContainer: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    padding: 16,
  },
  rotatedSection: {
    transform: [{ rotate: '180deg' }],
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    padding: 16,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonsContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modern toggle switch styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 25,
    padding: 3,
    marginBottom: 12,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mirrorToggle: {
    // Mirror toggle is rotated with parent, no additional styling needed
  },
  toggleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  toggleOptionActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleIcon: {
    fontSize: 18,
    color: '#9ca3af',
  },
  toggleIconActive: {
    color: '#ffffff',
  },
  floatingStopButton: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -40,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingStopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
};

export default MirrorMode;

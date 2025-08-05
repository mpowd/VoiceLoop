import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { actionButtonStyles } from '../styles/components';

interface ActionButtonsProps {
  // States
  isTranslating: boolean;
  isListening: boolean;
  isProcessingVoice: boolean;
  hasAudioPermission: boolean;
  hasText: boolean;

  // Actions
  onTranslate: () => void;
  onVoiceToggle: () => void;
  onClear: () => void;

  // Layout
  isVertical?: boolean;
  isMirror?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isTranslating,
  isListening,
  isProcessingVoice,
  hasAudioPermission,
  hasText,
  onTranslate,
  onVoiceToggle,
  onClear,
  isVertical = true,
  isMirror = false,
}) => {
  const containerStyle = isVertical
    ? actionButtonStyles.verticalContainer
    : actionButtonStyles.horizontalContainer;

  return (
    <View
      style={[containerStyle, isMirror && actionButtonStyles.mirrorContainer]}
    >
      {/* Translate Button */}
      <TouchableOpacity
        style={[
          actionButtonStyles.button,
          actionButtonStyles.translateButton,
          (isTranslating || !hasText) && actionButtonStyles.disabled,
        ]}
        onPress={onTranslate}
        disabled={isTranslating || !hasText}
        activeOpacity={0.8}
      >
        <Text style={actionButtonStyles.icon}>
          {isTranslating ? '⏳' : '🔄'}
        </Text>
      </TouchableOpacity>

      {/* Voice Input Button */}
      <TouchableOpacity
        style={[
          actionButtonStyles.button,
          actionButtonStyles.voiceButton,
          isListening && actionButtonStyles.voiceActive,
          isProcessingVoice && actionButtonStyles.voiceProcessing,
          !hasAudioPermission && actionButtonStyles.disabled,
        ]}
        onPress={onVoiceToggle}
        disabled={!hasAudioPermission}
        activeOpacity={0.8}
      >
        <Text style={actionButtonStyles.icon}>
          {isProcessingVoice ? '⏳' : isListening ? '🔴' : '🎙️'}
        </Text>
      </TouchableOpacity>

      {/* Clear Button */}
      <TouchableOpacity
        style={[actionButtonStyles.button, actionButtonStyles.clearButton]}
        onPress={onClear}
        activeOpacity={0.8}
      >
        <Text style={actionButtonStyles.icon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionButtons;

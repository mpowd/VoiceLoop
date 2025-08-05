import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Language } from '../types';
import { textAreaStyles } from '../styles/components';
import { copyToClipboard, hasErrorIndicators } from '../utils/helpers';
import TranslationLoading from './TranslationLoading';

interface TextAreaProps {
  // Language
  language: Language;

  // Text content
  text: string;
  placeholder?: string;

  // States
  isEditable?: boolean;
  isTranslating?: boolean;
  isSpeaking?: boolean;
  canSpeak?: boolean;

  // Actions
  onTextChange?: (text: string) => void;
  onSpeak?: () => void;

  // Layout
  isMirror?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({
  language,
  text,
  placeholder,
  isEditable = false,
  isTranslating = false,
  isSpeaking = false,
  canSpeak = false,
  onTextChange,
  onSpeak,
  isMirror = false,
}) => {
  const containerStyle = isMirror
    ? [textAreaStyles.container, textAreaStyles.mirrorContainer]
    : textAreaStyles.container;

  const textStyle = isMirror
    ? [textAreaStyles.text, textAreaStyles.mirrorText]
    : textAreaStyles.text;

  const labelStyle = isMirror
    ? [textAreaStyles.languageLabel, textAreaStyles.mirrorLabel]
    : textAreaStyles.languageLabel;

  return (
    <View style={containerStyle}>
      {/* Language Label */}
      <View style={labelStyle}>
        {/* Copy Button */}
        <TouchableOpacity
          style={textAreaStyles.copyButton}
          onPress={() => copyToClipboard(text)}
          disabled={!text.trim() || hasErrorIndicators(text)}
        >
          <Text
            style={[
              textAreaStyles.copyIcon,
              isMirror && textAreaStyles.mirrorText,
            ]}
          >
            📋
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            textAreaStyles.languageLabelText,
            isMirror && textAreaStyles.mirrorText,
          ]}
        >
          {language.flag} {language.native}
        </Text>

        {/* TTS Button */}
        {canSpeak && text.trim() && !hasErrorIndicators(text) && (
          <TouchableOpacity
            style={[
              textAreaStyles.ttsButton,
              isSpeaking && textAreaStyles.ttsButtonActive,
            ]}
            onPress={onSpeak}
            disabled={isSpeaking}
          >
            <Text
              style={[
                textAreaStyles.ttsIcon,
                isMirror && textAreaStyles.mirrorText,
              ]}
            >
              {isSpeaking ? '🔊' : '🔈'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Text Content */}
      {isEditable ? (
        <TextInput
          style={[
            textAreaStyles.textInput,
            isMirror && textAreaStyles.mirrorTextInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          value={text}
          onChangeText={onTextChange}
          multiline={true}
          textAlignVertical="top"
        />
      ) : (
        <ScrollView
          style={[
            textAreaStyles.scrollArea,
            isMirror && textAreaStyles.mirrorScrollArea,
          ]}
          contentContainerStyle={textAreaStyles.scrollContent}
        >
          {isTranslating ? (
            <TranslationLoading />
          ) : (
            <Text style={textStyle}>
              {text ||
                (isMirror
                  ? 'Translation appears here...'
                  : 'Übersetzung erscheint hier...')}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default TextArea;

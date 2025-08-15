import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Language, ChatSettings } from '../types';
import { layoutStyles } from '../styles/components';
import LanguageBar from './LanguageBar';
import LanguageSelector from './LanguageSelector';
import MenuModal from './MenuModal';
import ChatSettingsModal from './ChatSettingsModal';
import { languages } from '../utils/languages';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatModeProps {
  // Languages (for UI consistency)
  sourceLanguage: Language;
  targetLanguage: Language;

  // Chat specific
  isGenerating: boolean;
  chatSettings: ChatSettings;
  showChatSettings: boolean;

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
  onSendMessage: (message: string) => void;
  onStopSpeaking: () => void;
  onClearChat: () => void;

  // Language Actions (for consistency)
  onSourceLanguageSelect: (language: Language) => void;
  onTargetLanguageSelect: (language: Language) => void;
  onSwapLanguages: () => void;

  // UI Actions
  onChatModeToggle: () => void;
  onMenuToggle: () => void;
  onCloseMenu: () => void;
  onShowSourceSelector: (show: boolean) => void;
  onShowTargetSelector: (show: boolean) => void;
  onSourceSearchChange: (query: string) => void;
  onTargetSearchChange: (query: string) => void;

  // Chat settings actions
  onChatSettingsChange: (settings: ChatSettings) => void;
  onShowChatSettings: (show: boolean) => void;

  // Chat messages
  messages: ChatMessage[];
}

const ChatMode: React.FC<ChatModeProps> = ({
  // Languages
  sourceLanguage,
  targetLanguage,

  // Chat
  isGenerating,
  messages,
  chatSettings,
  showChatSettings,

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
  onSendMessage,
  onStopSpeaking,
  onClearChat,

  // Language Actions
  onSourceLanguageSelect,
  onTargetLanguageSelect,
  onSwapLanguages,

  // UI Actions
  onChatModeToggle,
  onMenuToggle,
  onCloseMenu,
  onShowSourceSelector,
  onShowTargetSelector,
  onSourceSearchChange,
  onTargetSearchChange,

  // Chat settings actions
  onChatSettingsChange,
  onShowChatSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    const trimmedText = inputText.trim();
    if (trimmedText && !isGenerating) {
      onSendMessage(trimmedText);
      setInputText('');
    }
  };

  const handleClearAll = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear all messages?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClearChat },
    ]);
  };

  return (
    <SafeAreaView style={chatStyles.container}>
      <KeyboardAvoidingView
        style={chatStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with Language Bar */}
        <LanguageBar
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          isChatMode={true}
          onSourceLanguagePress={() => onShowSourceSelector(true)}
          onTargetLanguagePress={() => onShowTargetSelector(true)}
          onSwapLanguages={onSwapLanguages}
          onChatModeToggle={onChatModeToggle}
          onMenuPress={onMenuToggle}
        />

        {/* Chat Header with Settings */}
        <View style={chatStyles.chatHeader}>
          <View style={chatStyles.chatHeaderLeft}>
            <Text style={chatStyles.chatTitle}>Chat Assistant</Text>
            {chatSettings.systemPrompt && (
              <Text style={chatStyles.chatSubtitle} numberOfLines={1}>
                {chatSettings.systemPrompt.length > 50
                  ? `${chatSettings.systemPrompt.substring(0, 50)}...`
                  : chatSettings.systemPrompt}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={chatStyles.settingsButton}
            onPress={() => onShowChatSettings(true)}
          >
            <Text style={chatStyles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Messages Area */}
        <View style={chatStyles.messagesContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={chatStyles.scrollView}
            contentContainerStyle={chatStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={chatStyles.emptyContainer}>
                <Text style={chatStyles.emptyIcon}>💬</Text>
                <Text style={chatStyles.emptyTitle}>Start a Conversation</Text>
                <Text style={chatStyles.emptySubtitle}>
                  {chatSettings.systemPrompt
                    ? 'Your AI assistant is ready with custom settings!'
                    : "Ask me anything! I'm here to help with questions, creative writing, analysis, coding, and much more."}
                </Text>
                {!chatSettings.systemPrompt && (
                  <TouchableOpacity
                    style={chatStyles.setupButton}
                    onPress={() => onShowChatSettings(true)}
                  >
                    <Text style={chatStyles.setupButtonText}>
                      ⚙️ Setup Assistant
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              messages.map(message => (
                <View
                  key={message.id}
                  style={[
                    chatStyles.messageContainer,
                    message.role === 'user'
                      ? chatStyles.userMessage
                      : chatStyles.assistantMessage,
                  ]}
                >
                  <View
                    style={[
                      chatStyles.messageBubble,
                      message.role === 'user'
                        ? chatStyles.userBubble
                        : chatStyles.assistantBubble,
                    ]}
                  >
                    <Text style={chatStyles.messageText}>
                      {message.content}
                    </Text>
                  </View>
                  <Text style={chatStyles.messageTime}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))
            )}

            {/* Typing indicator */}
            {isGenerating && (
              <View
                style={[
                  chatStyles.messageContainer,
                  chatStyles.assistantMessage,
                ]}
              >
                <View
                  style={[chatStyles.messageBubble, chatStyles.assistantBubble]}
                >
                  <View style={chatStyles.typingContainer}>
                    <View
                      style={[chatStyles.typingDot, chatStyles.typingDot1]}
                    />
                    <View
                      style={[chatStyles.typingDot, chatStyles.typingDot2]}
                    />
                    <View
                      style={[chatStyles.typingDot, chatStyles.typingDot3]}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={chatStyles.inputContainer}>
          <View style={chatStyles.inputRow}>
            <TextInput
              style={[
                chatStyles.textInput,
                isGenerating && chatStyles.textInputDisabled,
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#6b7280"
              multiline
              maxLength={2000}
              editable={!isGenerating}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />

            <View style={chatStyles.actionButtons}>
              {/* Clear Chat Button */}
              {messages.length > 0 && (
                <TouchableOpacity
                  style={[chatStyles.actionButton, chatStyles.clearButton]}
                  onPress={handleClearAll}
                  disabled={isGenerating}
                >
                  <Text style={chatStyles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              )}

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  chatStyles.actionButton,
                  chatStyles.sendButton,
                  (!inputText.trim() || isGenerating) &&
                    chatStyles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isGenerating}
              >
                <Text style={chatStyles.sendButtonText}>
                  {isGenerating ? '⏳' : '📤'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Character count */}
          <Text style={chatStyles.characterCount}>{inputText.length}/2000</Text>
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

        {/* Chat Settings Modal */}
        <ChatSettingsModal
          visible={showChatSettings}
          settings={chatSettings}
          onClose={() => onShowChatSettings(false)}
          onSave={onChatSettingsChange}
        />

        {/* Stop Speaking Button (floating if speaking) */}
        {(isSpeakingInput || isSpeakingOutput) && (
          <TouchableOpacity
            style={chatStyles.floatingStopButton}
            onPress={onStopSpeaking}
          >
            <Text style={chatStyles.floatingStopButtonText}>🔇 Stop</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Chat-specific styles - erweitert um neue Chat Header Styles
const chatStyles = {
  container: {
    flex: 1,
    backgroundColor: '#0f0f23', // Dein App-Hintergrund
  },
  chatHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  chatHeaderLeft: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  chatSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  settingsButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 10,
    marginLeft: 12,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  setupButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Konsistent mit deinen anderen Modi
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
    minHeight: 300,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end' as const,
  },
  assistantMessage: {
    alignItems: 'flex-start' as const,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  typingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginHorizontal: 2,
  },
  typingDot1: {
    // Animation can be added here
  },
  typingDot2: {
    // Animation can be added here
  },
  typingDot3: {
    // Animation can be added here
  },
  inputContainer: {
    backgroundColor: '#16213e', // Konsistent mit deinem Design
    borderTopWidth: 1,
    borderTopColor: '#374151',
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 120,
    textAlignVertical: 'top' as const,
    minHeight: 48,
  },
  textInputDisabled: {
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  sendButton: {
    backgroundColor: '#16a34a', // Grün für Send
  },
  sendButtonDisabled: {
    backgroundColor: '#6b7280',
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 18,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  characterCount: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right' as const,
    marginTop: 4,
  },
  floatingStopButton: {
    position: 'absolute' as const,
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
    fontWeight: '600' as const,
  },
};

export default ChatMode;

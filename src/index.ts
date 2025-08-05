// Main App Component
export { default as App } from './App';

// Components
export { default as LoadingScreen } from './components/LoadingScreen';
export { default as TranslationLoading } from './components/TranslationLoading';
export { default as LanguageSelector } from './components/LanguageSelector';
export { default as MenuModal } from './components/MenuModal';
export { default as LanguageBar } from './components/LanguageBar';
export { default as ActionButtons } from './components/ActionButtons';
export { default as TextArea } from './components/TextArea';
export { default as NormalMode } from './components/NormalMode';
export { default as MirrorMode } from './components/MirrorMode';

// Hooks
export { useVoiceRecognition } from './hooks/useVoiceRecognition';
export { useTextToSpeech } from './hooks/useTextToSpeech';
export { useGemmaModel } from './hooks/useGemmaModel';
export { useTranslation } from './hooks/useTranslation';
export { useAppState } from './hooks/useAppState';

// Types
export * from './types';

// Utils
export { languages } from './utils/languages';
export * from './utils/helpers';

// Styles
export * from './styles/colors';
export * from './styles/components';
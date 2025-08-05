import { Alert, Vibration, Clipboard } from 'react-native';

// Copy to clipboard helper
export const copyToClipboard = async (text: string): Promise<void> => {
  if (!text || text.trim() === '') {
    Alert.alert('Hinweis', 'Kein Text zum Kopieren vorhanden');
    return;
  }

  try {
    await Clipboard.setString(text);
    Vibration.vibrate(50);
    Alert.alert('Kopiert', 'Text wurde in die Zwischenablage kopiert');
  } catch (error) {
    console.error('Clipboard error:', error);
    Alert.alert('Fehler', 'Text konnte nicht kopiert werden');
  }
};

// Clean text for TTS (remove emojis and special characters)
export const cleanTextForTTS = (text: string): string => {
  return text
    .replace(/[🔍🤖✅❌🔄🌐🗑️🎤⏳]/g, '')
    .replace(/Übersetze\.\.\./g, '')
    .replace(/Translating\.\.\./g, '')
    .trim();
};

// Check if text contains error indicators
export const hasErrorIndicators = (text: string): boolean => {
  return text.includes('❌') || 
         text.includes('🔄') || 
         text.includes('Translation') ||
         text.includes('Error:');
};

// Format language code for TTS
export const formatLanguageForTTS = (languageCode: string): string => {
  return languageCode.includes('-') ? languageCode : languageCode + '-US';
};

// Vibration patterns
export const vibrationPatterns = {
  short: 50,
  medium: 100,
  success: [0, 50, 100, 50],
  error: [0, 100, 50, 100],
} as const;

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
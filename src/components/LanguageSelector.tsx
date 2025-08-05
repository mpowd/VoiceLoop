import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Language } from '../types';
import { languageSelectorStyles } from '../styles/components';
import { colors } from '../styles/colors';

interface LanguageSelectorProps {
  visible: boolean;
  languages: Language[];
  selectedLanguage: Language;
  title: string;
  searchQuery: string;
  onSelect: (language: Language) => void;
  onClose: () => void;
  onSearchChange: (query: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  languages,
  selectedLanguage,
  title,
  searchQuery,
  onSelect,
  onClose,
  onSearchChange,
}) => {
  const filteredLanguages = languages.filter(
    language =>
      language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      language.native.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={languageSelectorStyles.modal}>
          <View style={languageSelectorStyles.container}>
            <Text style={languageSelectorStyles.title}>{title}</Text>

            {/* Search Input */}
            <View style={languageSelectorStyles.searchContainer}>
              <TextInput
                style={languageSelectorStyles.searchInput}
                placeholder="Search languages..."
                placeholderTextColor={colors.text.secondary}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
              <Text style={languageSelectorStyles.searchIcon}>🔍</Text>
            </View>

            {/* Language List */}
            <ScrollView
              style={languageSelectorStyles.list}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {filteredLanguages.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    languageSelectorStyles.option,
                    selectedLanguage.code === language.code &&
                      languageSelectorStyles.selectedOption,
                  ]}
                  onPress={() => onSelect(language)}
                >
                  <Text style={languageSelectorStyles.flag}>
                    {language.flag}
                  </Text>
                  <View style={languageSelectorStyles.textContainer}>
                    <Text
                      style={[
                        languageSelectorStyles.name,
                        selectedLanguage.code === language.code &&
                          languageSelectorStyles.selectedName,
                      ]}
                    >
                      {language.name}
                    </Text>
                    <Text
                      style={[
                        languageSelectorStyles.native,
                        selectedLanguage.code === language.code &&
                          languageSelectorStyles.selectedNative,
                      ]}
                    >
                      {language.native}
                    </Text>
                  </View>
                  {selectedLanguage.code === language.code && (
                    <Text style={languageSelectorStyles.selectedCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Local styles (modal overlay)
const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default LanguageSelector;

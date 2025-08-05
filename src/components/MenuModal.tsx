import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { menuModalStyles } from '../styles/components';
import { colors } from '../styles/colors';

interface MenuItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onItemPress?: (itemId: string) => void;
}

const MenuModal: React.FC<MenuModalProps> = ({
  visible,
  onClose,
  onItemPress,
}) => {
  const menuItems: MenuItem[] = [
    {
      id: 'voice',
      icon: '🎤',
      title: 'Voice Mode',
      subtitle: 'Sprechen & Übersetzen',
    },
    {
      id: 'history',
      icon: '📚',
      title: 'History',
      subtitle: 'Übersetzungsverlauf',
    },
    {
      id: 'favorites',
      icon: '⭐',
      title: 'Favorites',
      subtitle: 'Gespeicherte Übersetzungen',
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'Settings',
      subtitle: 'App-Einstellungen',
    },
  ];

  const handleItemPress = (itemId: string) => {
    onItemPress?.(itemId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={menuModalStyles.container}>
          {/* Header */}
          <View style={menuModalStyles.header}>
            <Text style={menuModalStyles.title}>Menu</Text>
            <TouchableOpacity
              style={menuModalStyles.closeButton}
              onPress={onClose}
            >
              <Text style={menuModalStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={menuModalStyles.items}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={menuModalStyles.item}
                onPress={() => handleItemPress(item.id)}
              >
                <Text style={menuModalStyles.itemIcon}>{item.icon}</Text>
                <View style={menuModalStyles.itemText}>
                  <Text style={menuModalStyles.itemTitle}>{item.title}</Text>
                  <Text style={menuModalStyles.itemSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Local styles
const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};

export default MenuModal;

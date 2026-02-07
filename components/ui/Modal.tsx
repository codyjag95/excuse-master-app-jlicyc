
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Pressable,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'error' | 'success' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export default function Modal({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText,
  onConfirm,
}: ModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const cardColor = isDark ? colors.cardDark : colors.card;
  const textColor = isDark ? colors.textDark : colors.text;

  const getTypeColor = () => {
    switch (type) {
      case 'error':
        return '#FF3B30';
      case 'success':
        return colors.slimeGreen;
      case 'warning':
        return colors.highlight;
      default:
        return colors.electricOrange;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modalContainer, { backgroundColor: cardColor }]} onPress={(e) => e.stopPropagation()}>
          {title && (
            <View style={[styles.header, { borderBottomColor: getTypeColor() }]}>
              <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            </View>
          )}
          
          <View style={styles.content}>
            <Text style={[styles.message, { color: textColor }]}>{message}</Text>
          </View>

          <View style={styles.buttonContainer}>
            {cancelText && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: cardColor, borderColor: textColor }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: textColor }]}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: getTypeColor() }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  confirmButton: {
    // Background color set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

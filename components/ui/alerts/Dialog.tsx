// components/ui/alerts/Dialog.tsx
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';

export type DialogType = 'success' | 'error' | 'info';

interface DialogProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  type?: DialogType;
}

export default function Dialog({ visible, message, onClose, type = 'info' }: DialogProps) {
  const theme = useTheme();

  const backgroundColor = {
    success: theme.success,
    error: theme.error,
    info: theme.tint,
  }[type];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
          <Pressable
            style={[styles.button, { backgroundColor }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialog: {
    width: '80%',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  message: {
    fontSize: fonts.size.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: fonts.size.md,
    fontWeight: '600',
  },
});

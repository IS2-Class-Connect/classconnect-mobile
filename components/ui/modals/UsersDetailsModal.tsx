// components/ui/modals/UserDetailsModal.tsx

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { User } from '../../../services/userApi';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
}

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
            {user.urlProfilePhoto && (
              <Image
                source={{ uri: user.urlProfilePhoto }}
                style={styles.avatar}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
            <Text style={[styles.email, { color: theme.text }]}>{user.email}</Text>
            <View style={styles.infoSection}>
              <Text style={[styles.label, { color: theme.text }]}>Biography</Text>
              <Text style={[styles.info, { color: theme.text }]}>
                {user.description || 'No biography provided.'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: fonts.size.md,
    marginBottom: spacing.lg,
  },
  infoSection: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.size.sm,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  info: {
    fontSize: fonts.size.md,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#339CFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fonts.size.md,
  },
});

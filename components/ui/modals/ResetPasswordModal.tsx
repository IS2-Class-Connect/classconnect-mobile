import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import { sendPasswordReset } from '../../../firebase/auth';
import { spacing } from '../../../constants/spacing';
import { useTheme } from '../../../context/ThemeContext';

export default function ResetPasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notFoundError, setNotFoundError] = useState(false);
  const [generalError, setGeneralError] = useState(false);

  const handleReset = async () => {
    if (!email) return;

    try {
      await sendPasswordReset(email);
      setSuccessMessage('Password reset email sent!');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setNotFoundError(true);
      } else {
        setGeneralError(true);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.background }]}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Reset Your Password</Text>

          <TextField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={{
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            placeholderTextColor={theme.text + '88'}
          />

          <View style={styles.buttons}>
            <Button title="Send Reset Link" onPress={handleReset} />
            <Button title="Cancel" onPress={onClose} variant="secondary" />
          </View>

          <Dialog
            visible={!!successMessage}
            message={successMessage ?? ''}
            onClose={() => {
              setSuccessMessage(null);
              onClose();
            }}
            type="success"
          />

          <Dialog
            visible={notFoundError}
            message="No account found with that email address."
            onClose={() => setNotFoundError(false)}
            type="error"
          />

          <Dialog
            visible={generalError}
            message="Something went wrong. Please try again."
            onClose={() => setGeneralError(false)}
            type="error"
          />
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
  },
  card: {
    width: '90%',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttons: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});

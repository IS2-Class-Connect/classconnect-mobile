// components/ui/RegisterForm.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { registerWithEmail } from '../../../firebase/auth';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { notifyRegisterToDB } from '../../../services/userApi';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import SetLocationForm from './SetLocationForm';
import { useRouter } from 'expo-router';

export default function RegisterForm({ onCancel }: { onCancel: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showServerError, setShowServerError] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await registerWithEmail(email, password);
      notifyRegisterToDB({ ...res.user, displayName: name });
      setShowLocationModal(true);
    } catch (e: any) {
      console.error('❌ Registration error:', e);
      setShowServerError(true);
    }
  };

  const handleLocationFinished = () => {
    setShowLocationModal(false);
    setShowSuccess(true);
  };

  return (
    <Animated.View entering={FadeInRight.duration(400)}>
      <Text style={[styles.title, { color: theme.text }]}>Register</Text>

      <TextField
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextField
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {error !== '' && <Text style={[styles.error, { color: theme.error }]}>{error}</Text>}

      <Button title="Register" onPress={handleRegister} />

      <View style={styles.link}>
        <Text style={{ color: theme.tint }} onPress={onCancel}>
          Back to login
        </Text>
      </View>

      <Dialog
        visible={showServerError}
        message="There was a problem registering. Please try again."
        onClose={() => setShowServerError(false)}
        type="error"
      />

      <Dialog
        visible={showSuccess}
        message="Registration successful! Please check your email inbox to verify your account before logging in."
        onClose={() => {
          setShowSuccess(false);
          onCancel();
        }}
        type="success"
      />

      <Modal
        animationType="slide"
        transparent={false}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <SetLocationForm onClose={handleLocationFinished} />
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  link: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  error: {
    marginBottom: spacing.sm,
    fontSize: fonts.size.sm,
    fontWeight: '500',
  },
});

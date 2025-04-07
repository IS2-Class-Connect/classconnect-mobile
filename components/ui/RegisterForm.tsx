// components/ui/RegisterForm.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { registerWithEmail } from '../../firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { fonts } from '../../constants/fonts';
import { notifyRegisterToDB } from '../../services/userApi';
import TextField from './fields/TextField';
import Button from './buttons/Button';

export default function RegisterForm({ onCancel }: { onCancel: () => void }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

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
      notifyRegisterToDB(res.user); // optional backend hook
      onCancel(); // return to login form
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    }
  };

  return (
    <View>
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
    </View>
  );
}

const styles = StyleSheet.create({
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

// app/auth/register.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import RegisterForm from '../../components/ui/RegisterForm';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <RegisterForm onCancel={() => router.push('/auth/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
});

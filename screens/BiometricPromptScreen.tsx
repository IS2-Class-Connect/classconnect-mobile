import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import Dialog from '../components/ui/alerts/Dialog';
import { spacing } from '../constants/spacing';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricPrompt() {
  const theme = useTheme();
  const router = useRouter();
  const [errorVisible, setErrorVisible] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    console.log('📱 Biometric hardware:', hasHardware);
    console.log('📇 Biometric enrolled:', isEnrolled);

    if (!hasHardware || !isEnrolled) {
      console.log('⚠️ Biometric not available');
      setErrorVisible(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to Login',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
    });

    console.log('🔐 Auth result:', result);

    if (result.success) {
      console.log('✅ Auth success');
      router.replace('/(tabs)');
    } else {
      console.log('❌ Auth failed');
      setErrorVisible(true);
    }
  } catch (error) {
    console.log('❌ Biometric auth error:', error);
    setErrorVisible(true);
  } finally {
    setIsAuthenticating(false);
  }
};


    authenticate();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Ionicons
        name="lock-closed-outline"
        size={64}
        color={theme.text}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: theme.text }]}>
        Verifying your identity...
      </Text>
      {isAuthenticating && <ActivityIndicator size="large" color={theme.tint} />}
      <Dialog
        visible={errorVisible}
        message="Could not verify your identity. Please try again or log in manually."
        type="error"
        onClose={() => router.replace('/login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

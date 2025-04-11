import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';
import { useGoogleSignIn } from '../../../firebase';
import { loginWithEmail } from '../../../firebase/auth';
import Dialog from '../alerts/Dialog';

export default function LoginForm({
  isLoading,
  setIsLoading,
  onShowRegister,
}: {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onShowRegister: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'server' | null>(null);
  const { promptAsync, handleGoogleResponse, response } = useGoogleSignIn();

  const handleEmailLogin = async () => {
    try {
      setIsLoading(true);
      const result = await loginWithEmail(email, password);
      console.log('✅ Logged in user:', result.user.email);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (typeof error === 'object' && 'code' in error) {
        const code = error.code;
        if (
          code === 'auth/user-not-found' ||
          code === 'auth/wrong-password' ||
          code === 'auth/invalid-login-credentials'
        ) {
          setErrorType('auth');
        } else {
          setErrorType('server');
        }
      } else {
        setErrorType('server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await promptAsync();
      console.log('🔄 Google Sign In result:', result);
    } catch (error) {
      console.error('❌ Google login error:', error);
      setErrorType('server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TextField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />
      <Button
        title="Log In"
        onPress={handleEmailLogin}
        variant="primary"
        disabled={isLoading}
      />
      <Button
        title="Register"
        onPress={onShowRegister}
        variant="primary"
        disabled={isLoading}
      />
      <IconButton
        title="Continue with Google"
        icon={require('../../../assets/icons/google-blue.png')}
        onPress={handleGoogleLogin}
        disabled={isLoading}
        loading={isLoading}
      />

      <Dialog
        visible={errorType === 'auth'}
        message="Invalid email or password. Please try again."
        onClose={() => setErrorType(null)}
        type="error"
      />

      <Dialog
        visible={errorType === 'server'}
        message="Something went wrong. Please try again later."
        onClose={() => setErrorType(null)}
        type="error"
      />
    </View>
  );
}

const styles = StyleSheet.create({});

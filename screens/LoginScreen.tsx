import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import { useRouter } from 'expo-router';

import RegisterForm from '../components/ui/forms/RegisterForm';
import TextField from '../components/ui/fields/TextField';
import IconButton from '../components/ui/buttons/IconButton';
import Button from '../components/ui/buttons/Button';
import { useGoogleSignIn } from '../firebase';
import { loginWithEmail } from '../firebase/auth';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const LOGO_SIZE = 180;

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [showRegister, setShowRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const rotation = useSharedValue(0);
  const { promptAsync, handleGoogleResponse, response } = useGoogleSignIn();

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      handleGoogleResponse();
    } else if (response?.type === 'error') {
      console.error('❌ Google sign-in error:', response.error);
      Alert.alert(
        'Login Error',
        'Unable to sign in with Google. Please try again.'
      );
    }
  }, [response]);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 6000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await promptAsync();
      console.log('🔄 Google Sign In result:', result);
    } catch (error) {
      console.error('❌ Google login error:', error);
      Alert.alert(
        'Login Error',
        'Unable to sign in with Google. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      setIsLoading(true);
      const result = await loginWithEmail(email, password);
      console.log('✅ Logged in user:', result.user.email);
      router.replace('/(tabs)');

    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value + 180}deg` }],
    position: 'absolute',
    backfaceVisibility: 'hidden',
  }));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Title */}
        <Text style={[styles.title, { color: theme.tint, textShadowColor: theme.icon }]}>
          ClassConnect
        </Text>

        {/* 3D Spinning logo */}
        <View style={styles.logoWrapper}>
          <Animated.Image
            source={require('../assets/images/app_logo.png')}
            style={[styles.logo, frontStyle]}
            resizeMode="contain"
          />
          <Animated.Image
            source={require('../assets/images/app_logo.png')}
            style={[styles.logo, backStyle]}
            resizeMode="contain"
          />
        </View>

        {/* Login/Register Form */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {showRegister ? (
            <RegisterForm onCancel={() => setShowRegister(false)} />
          ) : (
            <>
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
                onPress={() => setShowRegister(true)}
                variant="primary"
                disabled={isLoading}
              />
              <IconButton
                title="Continue with Google"
                icon={require('../assets/icons/google-blue.png')}
                onPress={handleGoogleLogin}
                disabled={isLoading}
                loading={isLoading}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fonts.size.xxl,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.bold as '700',
    marginBottom: spacing.md,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    position: 'absolute',
  },
  card: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
});

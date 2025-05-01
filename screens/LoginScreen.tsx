import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Text,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import RegisterForm from '../components/ui/forms/RegisterForm';
import LoginForm from '../components/ui/forms/LoginForm';
import ThemeToggleButton from '../components/ui/buttons/ThemeToggleButton'; // Import the theme toggle button
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const LOGO_SIZE = 180;

export default function LoginScreen() {
  const theme = useTheme();
  const [showRegister, setShowRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const rotation = useSharedValue(0);

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
      {/* Theme Toggle Button positioned at the top right */}
      <View style={styles.themeToggleContainer}>
        <ThemeToggleButton />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.tint, textShadowColor: theme.icon }]}>ClassConnect</Text>

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

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {showRegister ? (
            <RegisterForm onCancel={() => setShowRegister(false)} />
          ) : (
            <LoginForm
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              onShowRegister={() => setShowRegister(true)}
            />
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
  themeToggleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Adjust for status bar on iOS
    right: spacing.lg,
    zIndex: 10, // Ensure it's above other elements
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
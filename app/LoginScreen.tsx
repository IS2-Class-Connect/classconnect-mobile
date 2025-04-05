import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';

const LOGO_SIZE = 220;

export default function Login() {
  const theme = useTheme();

  const rotation = useSharedValue(0);
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 12000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    fadeIn.value = withTiming(1, { duration: 1000 });
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

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: withTiming(fadeIn.value === 1 ? 0 : 30) }],
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

        <Animated.View
          style={[
            styles.card,
            fadeInStyle,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            placeholder="Email"
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholderTextColor={theme.icon}
          />
          <TextInput
            placeholder="Password"
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            secureTextEntry
            placeholderTextColor={theme.icon}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.tint }]}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles fixed for cross-platform including web
const styles = StyleSheet.create<{
  container: ViewStyle;
  scrollContainer: ViewStyle;
  logoWrapper: ViewStyle;
  logo: ImageStyle;
  card: ViewStyle;
  input: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
}>({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    perspective: '1000', // must be a string for web compatibility
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // elevation removed for web
  },
  card: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  input: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: fonts.weight.bold as '700',
    fontSize: fonts.size.md,
  },
});

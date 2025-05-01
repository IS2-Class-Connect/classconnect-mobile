import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function StartupScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const checkSession = async () => {

      if (!isLoading) {
        const lastLoginStr = await AsyncStorage.getItem('lastLogin');
        const lastLogin = lastLoginStr ? parseInt(lastLoginStr, 10) : 0;
        const twoWeeksInMs = 1000 * 60 * 60 * 24 * 14;
        const now = Date.now();

        if (user && now - lastLogin < twoWeeksInMs) {
          router.replace('/auth/biometric-prompt');

        } else {
          router.replace('/auth/login');
        }
      }
    };

    checkSession();
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

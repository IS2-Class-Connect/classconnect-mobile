import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {user?.urlProfilePhoto && (
        <Image source={{ uri: user.urlProfilePhoto }} style={styles.avatar} />
      )}
      <Text style={[styles.name, { color: theme.text }]}>
        {user?.name ?? 'No Name'}
      </Text>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <MaterialIcons name="logout" size={24} color={theme.error ?? theme.text} />
        <Text style={[styles.logoutText, { color: theme.error ?? theme.text }]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  logoutButton: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: fonts.size.md,
    fontWeight: '500',
  },
});

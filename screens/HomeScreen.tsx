import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth(); // Ahora obtenemos logout directamente del contexto
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.spacer} />
        <View style={styles.right}>
          {user?.urlProfilePhoto && (
            <Image
              source={{ uri: user.urlProfilePhoto }} // Cambiado de photoURL a urlProfilePhoto
              style={styles.avatar}
            />
          )}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.center}>
        <Text style={[styles.hello, { color: theme.text }]}>
          {user?.name ? `Hello, ${user.name}` : 'Hello!'} {/* Cambiado de displayName a name */}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Welcome to ClassConnect 👋
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: 48,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  logoutButton: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  hello: {
    fontSize: fonts.size.lg,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
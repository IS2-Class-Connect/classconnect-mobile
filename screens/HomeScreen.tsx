import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <Text style={[styles.hello, { color: theme.text }]}>
          {user?.name ? `Hello, ${user.name}` : 'Hello!'}
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

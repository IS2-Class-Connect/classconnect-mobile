import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

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

      <View style={styles.cards}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, type: 'timing' }}
          style={[styles.card, { backgroundColor: theme.card }]}
        >
          <Ionicons name="school-outline" size={32} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Teacher</Text>
          <Text style={[styles.cardText, { color: theme.text }]}>
            Create and manage courses, upload materials, and evaluate students through exams and assignments.
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400, type: 'timing' }}
          style={[styles.card, { backgroundColor: theme.card }]}
        >
          <Ionicons name="person-outline" size={32} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Student</Text>
          <Text style={[styles.cardText, { color: theme.text }]}>
            Enroll in courses, access study materials, and complete exams and assignments.
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 600, type: 'timing' }}
          style={[styles.card, { backgroundColor: theme.card }]}
        >
          <Ionicons name="people-outline" size={32} color={theme.primary} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Assistant</Text>
          <Text style={[styles.cardText, { color: theme.text }]}>
            Support teachers by uploading content and assisting in grading student work.
          </Text>
        </MotiView>
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
    marginBottom: spacing.lg,
  },
  cards: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    borderRadius: 12,
    padding: spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: fonts.size.md,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  cardText: {
    fontSize: fonts.size.sm,
    marginTop: spacing.xs,
  },
});

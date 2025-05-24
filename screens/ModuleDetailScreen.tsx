import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import { getModulesByCourse } from '../services/modulesMockApi';
import ResourceGrid from '../components/ui/lists/ResourceGrid';

export default function ModuleDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { moduleId, courseId } = useLocalSearchParams<{ moduleId: string; courseId: string }>();

  if (!moduleId || !courseId) return null;

  const modules = getModulesByCourse(Number(courseId));
  const current = modules.find((m) => m.id === moduleId);
  if (!current) return null;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primary }]}>{current.title}</Text>
        <Text style={[styles.description, { color: theme.text }]}>{current.description}</Text>
      </View>

      <View style={styles.resourcesSection}>
        <Text style={[styles.resourcesTitle, { color: theme.primary }]}>Resources</Text>
        <View style={styles.resourcesDivider} />
        <ResourceGrid moduleId={current.id} initialResources={current.resources} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  backButton: {
    marginTop: spacing.lg * 2, 
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  content: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fonts.size.md,
    textAlign: 'center',
  },
  resourcesSection: {
    marginTop: spacing.xl * 2,
  },
  resourcesTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  resourcesDivider: {
    height: 2,
    backgroundColor: '#ccc',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: 1,
  },
});

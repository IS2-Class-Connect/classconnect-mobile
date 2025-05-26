import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import { getModulesByCourse } from '../services/modulesMockApi';
import ReorderableResourceList from '../components/ui/lists/ReorderableResourceList';

export default function ModuleDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { moduleId, courseId, role } = useLocalSearchParams<{
    moduleId: string;
    courseId: string;
    role?: 'Student' | 'Professor' | 'Assistant';
  }>();

  if (!moduleId || !courseId) return null;

  const modules = getModulesByCourse(Number(courseId));
  const current = modules.find((m) => m.id === moduleId);
  if (!current) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.primary }]}>{current.title}</Text>
        <Text style={[styles.description, { color: theme.text }]}>{current.description}</Text>

        <Text style={[styles.resourcesTitle, { color: theme.primary }]}>Resources</Text>
        <View style={styles.resourcesDivider} />
      </View>

      <ReorderableResourceList
        moduleId={current.id}
        initialResources={current.resources}
        role={role}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
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
    marginBottom: spacing.md,
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
    borderRadius: 1,
  },
});

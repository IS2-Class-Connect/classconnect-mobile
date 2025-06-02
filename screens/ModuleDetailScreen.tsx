import React, { useEffect, useState } from 'react';
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
import { getModulesByCourse, Module, getResourcesByModule } from '../services/modulesApi';
import ReorderableResourceList from '../components/ui/lists/ReorderableResourceList';
import { useAuth } from '../context/AuthContext';

export default function ModuleDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken, user } = useAuth();

  const { moduleId, courseId, role } = useLocalSearchParams<{
    moduleId: string;
    courseId: string;
    role?: 'Student' | 'Professor' | 'Assistant';
  }>();

  const [currentModule, setCurrentModule] = useState<Module | null>(null);

  const fetchData = async () => {
    if (!authToken || !user || !courseId || !moduleId) return;

    try {
      const modules = await getModulesByCourse(Number(courseId), authToken);
      const current = modules.find((m) => m.id === moduleId);
      if (!current) return;

      const resources = await getResourcesByModule(current.id, Number(courseId), authToken);
      setCurrentModule({ ...current, resources });
    } catch (error) {
      console.error('Error loading module data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [moduleId, courseId]);

  if (!moduleId || !courseId || !currentModule || !authToken || !user?.uuid) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.primary }]}>{currentModule.title}</Text>
        <Text style={[styles.description, { color: theme.text }]}>{currentModule.description}</Text>

        <Text style={[styles.resourcesTitle, { color: theme.primary }]}>Resources</Text>
        <View style={styles.resourcesDivider} />
      </View>

      <ReorderableResourceList
        moduleId={currentModule.id}
        courseId={Number(courseId)}
        initialResources={currentModule.resources}
        role={role}
        authToken={authToken}
        userId={user.uuid}
        onOrderUpdate={async () => {
          const updated = await getResourcesByModule(currentModule.id, Number(courseId), authToken);
          setCurrentModule((prev) => prev ? { ...prev, resources: updated } : null);
        }}
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
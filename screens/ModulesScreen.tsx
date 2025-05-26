import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import ModuleForm from '../components/ui/forms/ModuleForm';
import { Module, getModulesByCourse, deleteModule } from '../services/modulesMockApi';
import ReorderableModuleList from '../components/ui/lists/ReorderableModuleList.tsx';

export default function ModulesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { role, courseId } = useLocalSearchParams<{ role?: string; courseId?: string }>();

  const [modules, setModules] = useState<Module[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const isAuthorized = role === 'Professor' || role === 'Assistant';

  useEffect(() => {
    if (courseId && !isNaN(Number(courseId))) {
      const all = getModulesByCourse(Number(courseId));
      setModules(all);
    }
  }, [courseId]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Module', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteModule(id);
          const updated = getModulesByCourse(Number(courseId));
          setModules(updated);
        },
      },
    ]);
  };

  const openEdit = (module: Module) => {
    setEditingModule(module);
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditingModule(null);
    setModalVisible(true);
  };

  const getMaxOrder = () => {
    if (modules.length === 0) return 0;
    return Math.max(...modules.map((m) => m.order));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.primary }]}>Modules</Text>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      </View>

     <ReorderableModuleList
        modules={modules}
        onUpdate={setModules}
        role={role as 'Professor' | 'Assistant' | 'Student'}
        onEdit={openEdit}
        onDelete={handleDelete}
      />


      {isAuthorized && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={openCreate}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: theme.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                backgroundColor: theme.card,
                padding: spacing.lg,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <ModuleForm
                initialValues={editingModule ?? undefined}
                courseId={Number(courseId)}
                defaultOrder={getMaxOrder()}
                onClose={() => {
                  setModalVisible(false);
                  const updated = getModulesByCourse(Number(courseId));
                  setModules(updated);
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    marginTop: spacing.lg,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.size.xl,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.bold as any,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});

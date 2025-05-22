import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import ModuleForm from '../components/ui/forms/ModuleForm';
import { Module, getModulesByCourse, deleteModule } from '../services/modulesMockApi';

export default function ModulesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { role, courseId } = useLocalSearchParams<{ role?: string; courseId?: string }>();

  const [modules, setModules] = useState<Module[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const isAuthorized = role === 'Professor' || role === 'Assistant';

  useEffect(() => {
    console.log('mi rol es ', role);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Back button visible y funcional */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      {modules.length > 0 ? (
        <FlatList
          data={modules.sort((a, b) => a.order - b.order)}
          contentContainerStyle={styles.list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.moduleCard, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => {}}
            >
              <View style={styles.moduleInfo}>
                <Text style={[styles.moduleTitle, { color: theme.primary }]}>{item.title}</Text>
              </View>

              {isAuthorized && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => openEdit(item)}>
                    <Ionicons name="create-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.text }]}>No modules yet.</Text>
        </View>
      )}

      {/* Floating add button SIEMPRE visible si tiene permiso */}
      {isAuthorized && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={openCreate}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal de formulario */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <ModuleForm
            initialValues={editingModule ?? undefined}
            courseId={Number(courseId)}
            onClose={() => {
              setModalVisible(false);
              const updated = getModulesByCourse(Number(courseId));
              setModules(updated);
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg },
  backButton: {
    marginTop: spacing.lg,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  moduleCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleInfo: { flex: 1, marginRight: spacing.md },
  moduleTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '700',
    fontFamily: fonts.family.regular,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
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
  modalContent: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: fonts.size.lg,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});

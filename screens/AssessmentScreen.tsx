import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import {
  getAssessmentsByCourse,
  deleteAssessment,
  Assessment,
} from '../services/assessmentsMockApi';
import AssessmentForm from '../components/ui/forms/AssessmentForm';
import Button from '../components/ui/buttons/Button';

export default function AssessmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken, user } = useAuth();
  const { courseId, role } = useLocalSearchParams<{
    courseId: string;
    role?: 'Student' | 'Professor' | 'Assistant';
  }>();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedTab, setSelectedTab] = useState<'exam' | 'assignment'>('exam');
  const [formVisible, setFormVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  const isProfessor = role === 'Professor';
  const isAssistant = role === 'Assistant';
  const isStudent = role === 'Student';

  const fetchAssessments = async () => {
    if (!authToken || !courseId) return;
    try {
      const data = await getAssessmentsByCourse(Number(courseId));
      setAssessments(data);
    } catch (e) {
      console.error('Error loading assessments:', e);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [courseId]);

  const filtered = assessments.filter((a) => a.type === selectedTab);

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this assessment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAssessment(Number(courseId), id);
            await fetchAssessments();
          } catch (e) {
            console.error('Delete failed:', e);
          }
        },
      },
    ]);
  };

  const getCardBorderColor = (assessment: Assessment): string => {
    const now = new Date();
    const start = new Date(assessment.start_time);
    const deadline = new Date(assessment.deadline);
    if (now < start) return '#007bff';
    if (now >= start && now <= deadline) return '#28a745';
    return '#dc3545';
  };

  const handleCardPress = (assessment: Assessment) => {
    const now = new Date();
    const start = new Date(assessment.start_time);
    const deadline = new Date(assessment.deadline);
    const isOpen = now >= start && now <= deadline;
    if (isOpen) {
      router.push({
        pathname: '/assessment-detail',
        params: {
          courseId,
          assessmentId: assessment.id.toString(),
        },
      });
    }
  };

  if (!authToken || !user || !courseId) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.primary }]}>Assessments</Text>

        <View style={styles.tabContainer}>
          {['exam', 'assignment'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedTab(type as 'exam' | 'assignment')}
              style={[
                styles.tabButton,
                {
                  borderBottomColor: selectedTab === type ? theme.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === type ? theme.primary : theme.text },
                ]}
              >
                {type === 'exam' ? 'Exams' : 'Tasks'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.list}>
          {filtered.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.text }]}>No {selectedTab}s found.</Text>
          )}

          {filtered.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.itemCard, { borderColor: getCardBorderColor(a) }]}
              onPress={() => handleCardPress(a)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{a.title}</Text>
                <Text style={{ color: theme.text, fontSize: fonts.size.sm }}>
                  Due: {new Date(a.deadline).toLocaleDateString()}
                </Text>
              </View>

              {(isProfessor || isAssistant) && (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity onPress={() => {
                    setEditingAssessment(a);
                    setFormVisible(true);
                  }}>
                    <Text style={{ fontSize: 18, color: theme.primary }}>✏️</Text>
                  </TouchableOpacity>

                  {isProfessor && (
                    <TouchableOpacity onPress={() => handleDelete(a.id)}>
                      <Text style={{ fontSize: 18, color: theme.primary }}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {isProfessor && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setEditingAssessment(null);
            setFormVisible(true);
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {formVisible && (
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <AssessmentForm
              courseId={Number(courseId)}
              initialData={editingAssessment ?? undefined}
              onClose={async () => {
                setFormVisible(false);
                setEditingAssessment(null);
                await fetchAssessments();
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  backButton: { marginBottom: spacing.md, alignSelf: 'flex-start' },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tabButton: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    marginHorizontal: spacing.md,
  },
  tabText: {
    fontSize: fonts.size.md,
    fontWeight: '600',
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  itemCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

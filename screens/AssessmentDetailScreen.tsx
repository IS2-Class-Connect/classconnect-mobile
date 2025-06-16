import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import {
  getAssessmentById,
  deleteAssessment,
  Assessment,
} from '../services/assessmentsMockApi';
import AssessmentForm from '../components/ui/forms/AssessmentForm';

export default function AssessmentDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { courseId, assessmentId, role } = useLocalSearchParams<{
    courseId: string | string[];
    assessmentId: string | string[];
    role?: 'Student' | 'Professor' | 'Assistant';
  }>();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [countdown, setCountdown] = useState('');
  const [editVisible, setEditVisible] = useState(false);

  const isProfessor = role === 'Professor';
  const isAssistant = role === 'Assistant';
  const isStudent = role === 'Student';

  const parsedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const parsedAssessmentId = Array.isArray(assessmentId) ? assessmentId[0] : assessmentId;

  useEffect(() => {
    if (parsedCourseId && parsedAssessmentId) {
      getAssessmentById(Number(parsedCourseId), parsedAssessmentId).then(setAssessment);
    }
  }, [parsedAssessmentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (assessment) {
      const updateCountdown = () => {
        const now = new Date();
        const start = new Date(assessment.start_time);
        const diff = start.getTime() - now.getTime();
        if (diff <= 0) {
          clearInterval(interval);
          setCountdown('Starting now');
          getAssessmentById(Number(parsedCourseId), parsedAssessmentId).then(setAssessment);
        } else {
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
      };
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    }
    return () => clearInterval(interval);
  }, [assessment]);

  const getStatus = () => {
    if (!assessment) return '';
    const now = new Date();
    const start = new Date(assessment.start_time);
    const end = new Date(assessment.deadline);
    if (now < start) return 'UPCOMING';
    if (now >= start && now <= end) return 'OPEN';
    return 'CLOSED';
  };

  const renderStatusTag = () => {
    const status = getStatus();
    let color = '#888';
    let label = '';

    if (status === 'OPEN') {
      color = '#28a745';
      label = 'Open ✅';
    } else if (status === 'UPCOMING') {
      color = '#f0ad4e';
      label = `Upcoming ⏳ - Starts in ${countdown}`;
    } else {
      color = '#dc3545';
      label = 'Closed ❌';
    }

    return <Text style={{ color, fontWeight: 'bold', marginBottom: spacing.md }}>{label}</Text>;
  };

  const handleDelete = () => {
    Alert.alert('Confirm delete', 'Are you sure you want to delete this assessment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAssessment(Number(parsedCourseId), parsedAssessmentId);
          router.back();
        },
      },
    ]);
  };

  if (!assessment) return null;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xl + 24 }}
      >
        <View style={{ marginBottom: 70 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20 }]}>
          <Text style={[styles.title, { color: theme.primary }]}>{assessment.title}</Text>

          <Text style={[styles.typeTag, { backgroundColor: theme.primary + '22', color: theme.primary }]}> {assessment.type} </Text>

          {renderStatusTag()}

          <Text style={[styles.label, { color: theme.text }]}>Start: {new Date(assessment.start_time).toLocaleString()}</Text>
          <Text style={[styles.label, { color: theme.text }]}>Deadline: {new Date(assessment.deadline).toLocaleString()}</Text>
          <Text style={[styles.label, { color: theme.text }]}>Duration: {assessment.tolerance_time} hours ⏱️</Text>

          <Text style={[styles.description, { color: theme.text }]}> {assessment.description || 'No description provided.'}</Text>

          <Text style={[styles.label, { color: theme.text, marginTop: spacing.lg }]}>Exercises: {Object.keys(assessment.exercises || {}).length}</Text>

          {(isProfessor || isAssistant) && (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() =>
                  router.push({ pathname: '/exercises-page', params: { courseId: parsedCourseId, assessmentId: parsedAssessmentId } })
                }
              >
                <Text style={styles.buttonText}>View Exercises</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buttonOutline, { borderColor: theme.primary }]}
                onPress={() => setEditVisible(true)}
              >
                <Text style={[styles.buttonText, { color: theme.primary }]}>Edit</Text>
              </TouchableOpacity>

              {isProfessor && (
                <TouchableOpacity
                  style={[styles.buttonOutline, { borderColor: '#dc3545' }]}
                  onPress={handleDelete}
                >
                  <Text style={[styles.buttonText, { color: '#dc3545' }]}>Delete</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.label, { color: theme.text, marginTop: spacing.md }]}>Submissions: {Object.keys(assessment.submissions || {}).length}</Text>
            </>
          )}

          {isStudent && getStatus() === 'OPEN' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() =>
                Alert.alert(
                  'Start Assessment',
                  'Are you sure? You will have limited time and cannot leave once started.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Start',
                      onPress: () =>
                        router.push({ pathname: '/assessment-start', params: { courseId: parsedCourseId, assessmentId: parsedAssessmentId } }),
                    },
                  ]
                )
              }
            >
              <Text style={styles.buttonText}>Start Assessment</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.overlayCentered}>
          <View style={[styles.modalContentLarge, { backgroundColor: theme.card }]}>
            <AssessmentForm
              courseId={Number(parsedCourseId)}
              initialData={assessment}
              onClose={async () => {
                setEditVisible(false);
                const updated = await getAssessmentById(Number(parsedCourseId), parsedAssessmentId);
                setAssessment(updated);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#339CFF',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: fonts.size.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.size.md,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fonts.size.md,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonOutline: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: fonts.size.md,
    color: '#fff',
  },
  overlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentLarge: {
    width: '95%',
    height: '92%',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

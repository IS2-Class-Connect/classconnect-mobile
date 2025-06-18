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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import {
  getAssessmentById,
  deleteAssessment,
  Assessment,
} from '../services/assessmentsApi';
import AssessmentForm from '../components/ui/forms/AssessmentForm';

export default function AssessmentDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, authToken } = useAuth();
  const { courseId, assessmentId, role } = useLocalSearchParams<{
    courseId: string | string[];
    assessmentId: string | string[];
    role?: 'Student' | 'Professor' | 'Assistant';
  }>();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [countdown, setCountdown] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const isProfessor = role === 'Professor';
  const isAssistant = role === 'Assistant';
  const isStudent = role === 'Student';

  const parsedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const parsedAssessmentId = Array.isArray(assessmentId) ? assessmentId[0] : assessmentId;

  const hasSubmitted = assessment?.submissions?.[user?.uuid ?? ''] !== undefined;

    useEffect(() => {
    if (parsedCourseId && parsedAssessmentId && authToken) {
      getAssessmentById(parsedAssessmentId, authToken)
        .then((data) => {
          console.log('🧪 Assessment fetched in DetailScreen:', JSON.stringify(data, null, 2));
          setAssessment(data);
        })
        .catch((err) => console.error('Error loading assessment:', err));
    }
  }, [parsedAssessmentId, parsedCourseId, authToken]);


    useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (assessment && parsedCourseId && parsedAssessmentId && authToken) {
      const updateCountdown = () => {
        const now = new Date();
        const start = new Date(assessment.startTime);
        const diff = start.getTime() - now.getTime();

        if (diff <= 0) {
          clearInterval(interval);
          setCountdown('Starting now');
          getAssessmentById(parsedAssessmentId, authToken)
            .then(setAssessment)
            .catch((err) => console.error('Error refreshing assessment:', err));
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
  }, [assessment, parsedCourseId, parsedAssessmentId, authToken]);


  // Verifica si ya arrancó el examen
  useEffect(() => {
    if (!parsedCourseId || !parsedAssessmentId || !isStudent) return;

    const checkStart = async () => {
      const key = `startTime_${parsedCourseId}_${parsedAssessmentId}`;
      const started = await AsyncStorage.getItem(key);
      setHasStarted(!!started);
    };

    checkStart();
  }, [assessment]);

  const getStatus = () => {
    if (!assessment) return '';
    const now = new Date();
    const start = new Date(assessment.startTime);
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
  if (!user || !authToken) {
    Alert.alert('Error', 'You must be logged in to delete this assessment.');
    return;
  }

  Alert.alert('Confirm delete', 'Are you sure you want to delete this assessment?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteAssessment(Number(parsedCourseId), parsedAssessmentId, authToken, user.uuid);
          router.back();
        } catch (error) {
          console.error('Error deleting assessment:', error);
          Alert.alert('Error', 'Could not delete assessment.');
        }
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

          <Text style={[styles.label, { color: theme.text }]}>Start: {new Date(assessment.startTime).toLocaleString()}</Text>
          <Text style={[styles.label, { color: theme.text }]}>Deadline: {new Date(assessment.deadline).toLocaleString()}</Text>
          <Text style={[styles.label, { color: theme.text }]}>Duration: {assessment.toleranceTime} hours ⏱️</Text>

          <Text style={[styles.description, { color: theme.text }]}> {assessment.description || 'No description provided.'}</Text>

          <Text style={[styles.label, { color: theme.text, marginTop: spacing.lg }]}> Exercises: {assessment.exercises?.length ?? 0}</Text>


          {(isProfessor || isAssistant) && (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() =>
                  router.push({
                    pathname: '/exercises',
                    params: {
                      courseId: parsedCourseId,
                      assessmentId: parsedAssessmentId,
                      role: role ?? 'Professor',
                    },
                  })
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
              style={[styles.button, { backgroundColor: hasSubmitted ? '#aaa' : theme.primary }]}
              onPress={() => {
              if (hasSubmitted) {
                Alert.alert('Already submitted', 'You have already submitted this assessment.');
                return;
              }

              if (hasStarted) {
                router.push({
                  pathname: '/exercises',
                  params: {
                    courseId: parsedCourseId,
                    assessmentId: parsedAssessmentId,
                    role: 'Student',
                  },
                });
              } else {
                Alert.alert(
                  'Start Assessment',
                  'Are you sure? You will have limited time and cannot leave once started.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Start',
                      onPress: () =>
                        router.push({
                          pathname: '/exercises',
                          params: {
                            courseId: parsedCourseId,
                            assessmentId: parsedAssessmentId,
                            role: 'Student',
                          },
                        }),
                    },
                  ]
                );
              }
}}

              disabled={hasSubmitted}
            >
              <Text style={styles.buttonText}>
                {hasSubmitted
                  ? 'Already Submitted'
                  : hasStarted
                  ? 'Continue Assessment'
                  : 'Start Assessment'}
              </Text>
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

                // Validación de condiciones necesarias
                if (!authToken || !parsedCourseId || !parsedAssessmentId) {
                  Alert.alert('Error', 'No se pudo actualizar la evaluación: faltan datos de autenticación o identificación.');
                  return;
                }

                try {
                  const updated = await getAssessmentById(parsedAssessmentId, authToken);
                  setAssessment(updated);
                } catch (error) {
                  console.error('Error al obtener la evaluación actualizada:', error);
                  Alert.alert('Error', 'No se pudo actualizar la evaluación.');
                }
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

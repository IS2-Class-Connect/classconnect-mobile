import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import {
  getAssessmentById,
  deleteAssessment,
  getUserSubmissionForAssessment,
  getSubmissionsForAssessment,
  Assessment,
  Submission,
} from '../services/assessmentsApi';
import AssessmentForm from '../components/ui/forms/AssessmentForm';
import StudentsSubmissionsModal from '../components/ui/modals/StudentsSubmissionsModal';


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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentSubmission, setStudentSubmission] = useState<Submission | null>(null);


  const isProfessor = role === 'Professor';
  const isAssistant = role === 'Assistant';
  const isStudent = role === 'Student';

  const parsedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
  const parsedAssessmentId = Array.isArray(assessmentId) ? assessmentId[0] : assessmentId;

  useEffect(() => {
  if (parsedCourseId && parsedAssessmentId && authToken) {
    getAssessmentById(parsedAssessmentId, authToken)
      .then(setAssessment)
      .catch((err) => {
        console.error('Error loading assessment:', err);
        if (
          err?.response?.status === 404 ||
          err?.message?.includes('404') ||
          err?.detail?.includes('not found')
        ) {
          Alert.alert(
            'Assessment not found',
            'This assessment was deleted. You will be returned to the previous screen.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Error', 'Failed to load the assessment.');
        }
      });
  }
}, [parsedAssessmentId, parsedCourseId, authToken]);



  useEffect(() => {
  let interval: NodeJS.Timeout | undefined;
  let cancelled = false;

  if (!assessment || !parsedAssessmentId || !authToken) return;

  const updateCountdown = async () => {
    const now = new Date();
    const start = new Date(assessment.startTime);
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) {
      clearInterval(interval);
      setCountdown('Starting now');
      try {
        const updated = await getAssessmentById(parsedAssessmentId, authToken);
        if (!cancelled) setAssessment(updated);
      } catch (err: any) {
        if (!cancelled && err?.response?.status === 404) {
          Alert.alert('Assessment deleted', 'It was removed during the countdown.');
          router.back();
        } else {
          console.error('Error refreshing assessment during countdown:', err);
        }
      }
    } else {
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      if (!cancelled) setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

  updateCountdown();
  interval = setInterval(updateCountdown, 1000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [assessment?.startTime, parsedAssessmentId, authToken]);


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

    const getGradeColor = (grade: number) => {
    if (grade < 4) return '#dc3545'; // rojo
    if (grade <= 6) return '#f0ad4e'; // naranja
    if (grade <= 9) return '#28c76f'; // verde claro
    return '#198754'; // verde oscuro (nota 10)
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

  const openSubmissionsModal = async () => {
    if (!parsedAssessmentId || !authToken) return;
    try {
      const data = await getSubmissionsForAssessment(parsedAssessmentId, authToken);
      setSubmissions(data);
      setModalVisible(true);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Could not load submissions.');
    }
  };

  if (!assessment) return null;
  const status = getStatus();

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xl + 24 }}>
        <View style={{ marginBottom: 70 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, marginTop: 20 }]}>
          <Text style={[styles.title, { color: theme.primary }]}>{assessment.title}</Text>

          <Text style={[styles.typeTag, { backgroundColor: theme.primary + '22', color: theme.primary }]}>
            {assessment.type}
          </Text>

          {renderStatusTag()}

          <Text style={[styles.label, { color: theme.text }]}>Start: {new Date(assessment.startTime).toLocaleString()}</Text>
          <Text style={[styles.label, { color: theme.text }]}>Deadline: {new Date(assessment.deadline).toLocaleString()}</Text>
          <Text style={[styles.label, { color: theme.text }]}>Duration: {assessment.toleranceTime} hours ⏱️</Text>

          <Text style={[styles.description, { color: theme.text }]}>{assessment.description || 'No description provided.'}</Text>

          <Text style={[styles.label, { color: theme.text, marginTop: spacing.lg }]}>Exercises: {assessment.exercises?.length ?? 0}</Text>

          {(isProfessor || isAssistant) && (
            <>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={openSubmissionsModal}>
                <Text style={styles.buttonText}>Submissions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() =>
                router.push({
                  pathname: '/exercises',
                  params: {
                    courseId: parsedCourseId,
                    assessmentId: parsedAssessmentId,
                    role: role ?? 'Professor',
                  },
                })
              }>
                <Text style={styles.buttonText}>View Exercises</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.buttonOutline,
                  {
                    borderColor: status !== 'UPCOMING' ? '#aaa' : theme.primary,
                    opacity: status !== 'UPCOMING' ? 0.5 : 1,
                  },
                ]}
                onPress={() => setEditVisible(true)}
                disabled={status !== 'UPCOMING'}
              >
                <Text style={[styles.buttonText, { color: status !== 'UPCOMING' ? '#aaa' : theme.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>


              {isProfessor && (
                <TouchableOpacity style={[styles.buttonOutline, { borderColor: '#dc3545' }]} onPress={handleDelete}>
                  <Text style={[styles.buttonText, { color: '#dc3545' }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {isStudent && hasSubmitted && studentSubmission?.note !== undefined && (
            <>
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: fonts.size.lg,
                    marginTop: spacing.lg,
                    color: theme.text,
                  },
                ]}
              >
                Final grade:{' '}
                <Text style={{ fontWeight: 'bold', color: getGradeColor(studentSubmission.note!) }}>
                  {studentSubmission.note}/10
                </Text>
              </Text>

              <TouchableOpacity
                style={[styles.buttonOutline, { borderColor: theme.primary, marginTop: spacing.sm }]}
                onPress={() =>
                  router.push({
                    pathname: '/exercises-correction',
                    params: {
                      assessmentId: parsedAssessmentId,
                      userId: user!.uuid,
                      role: 'Student',
                    },
                  })
                }
              >
                <Text style={[styles.buttonText, { color: theme.primary }]}>View Correction</Text>
              </TouchableOpacity>
            </>
          )}



          {isStudent && (() => {
            const status = getStatus();
            const isTask = assessment.type === 'Task';
            const isLateTask = isTask && status === 'CLOSED';
            const canStart = (assessment.type === 'Exam' && status === 'OPEN') || isTask;

            if (!canStart) return null;

            return (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: hasSubmitted ? '#aaa' : theme.primary }]}
                onPress={() => {
                  if (hasSubmitted) {
                    Alert.alert('Already submitted', 'You have already submitted this assessment.');
                    return;
                  }

                  const params = {
                    pathname: '/exercises',
                    params: {
                      courseId: parsedCourseId,
                      assessmentId: parsedAssessmentId,
                      role: 'Student',
                    },
                  };

                  if (isLateTask) {
                    Alert.alert(
                      'Late Submission',
                      'You are about to start a task after the deadline. Please check with your professor if this is allowed.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Continue', onPress: () => router.push(params) },
                      ]
                    );
                    return;
                  }

                  if (hasStarted) {
                    router.push(params);
                  } else {
                    Alert.alert(
                      'Start Assessment',
                      'Are you sure? You will have limited time and cannot leave once started.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Start', onPress: () => router.push(params) },
                      ]
                    );
                  }
                }}
                disabled={hasSubmitted}
              >
                <Text style={styles.buttonText}>
                  {hasSubmitted
                    ? 'Already Submitted'
                    : isLateTask
                    ? 'Submit (Late)'
                    : hasStarted
                    ? 'Continue Assessment'
                    : 'Start Assessment'}
                </Text>
              </TouchableOpacity>
            );
          })()}
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
                if (!authToken || !parsedCourseId || !parsedAssessmentId) {
                  Alert.alert('Error', 'Failed to update assessment: missing data.');
                  return;
                }

                try {
                  const updated = await getAssessmentById(parsedAssessmentId, authToken);
                  setAssessment(updated);
                } catch (error) {
                  console.error('Error fetching updated assessment:', error);
                  Alert.alert('Error', 'Could not refresh assessment.');
                }
              }}
            />
          </View>
        </View>
      </Modal>

      <StudentsSubmissionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        submissions={submissions}
        assessmentType={assessment?.type ?? 'Exam'}
        onSelect={() => {}}
      />
    </>
  );
}

// ...styles idénticos...


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

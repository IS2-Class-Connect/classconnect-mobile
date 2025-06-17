import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Assessment,
  AssessmentExercise,
  getAssessmentById,
  submitAssessment,
} from '../services/assessmentsMockApi';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';

export default function ExercisesScreen() {
  const { assessmentId, courseId, role } = useLocalSearchParams<{
    assessmentId: string;
    courseId: string;
    role: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isStudent = role === 'Student';
  const isReadonly = !isStudent;

  const STORAGE_KEY = `startTime_${courseId}_${assessmentId}`;

  useEffect(() => {
    if (assessmentId && courseId) {
      getAssessmentById(Number(courseId), assessmentId).then(async (res) => {
        setAssessment(res);
        const durationMs = (res.tolerance_time ?? 0) * 60 * 60 * 1000;

        if (isStudent) {
          const savedStart = await AsyncStorage.getItem(STORAGE_KEY);
          let startTime = savedStart ? parseInt(savedStart, 10) : Date.now();
          if (!savedStart) {
            await AsyncStorage.setItem(STORAGE_KEY, startTime.toString());
          }
          const timePassed = Date.now() - startTime;
          const remaining = durationMs - timePassed;
          setRemainingTime(remaining > 0 ? remaining : 0);
        }
      });
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!isStudent || !remainingTime || submitted) return;

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [remainingTime, isStudent, submitted]);

  const handleSubmit = () => {
    if (!assessment || !user) return;
    Alert.alert(
      'Confirm submission',
      'This is final. Are you sure you want to submit?',
      [
        {
          text: 'Submit',
          onPress: async () => {
            await submitAssessment(Number(courseId), assessmentId, user.uuid, responses);
            await AsyncStorage.removeItem(STORAGE_KEY);
            setSubmitted(true);
            Alert.alert('Submitted', 'Your answers have been submitted.');
            router.back();
          },
          style: 'default',
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const currentExerciseId = Object.keys(assessment?.exercises || {})[index];
  const currentExercise = assessment?.exercises?.[currentExerciseId];

  const renderExercise = (exercise: AssessmentExercise, id: string) => {
    return (
      <View key={id} style={styles.exerciseContainer}>
        <Text style={[styles.enunciate, { color: theme.text }]}>{exercise.enunciate}</Text>

        {exercise.link && (
          <Text style={[styles.link, { color: theme.primary }]}>
            [Attached Resource: {exercise.link}]
          </Text>
        )}

        {exercise.type === 'multiple_choice' && exercise.choices && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[styles.notice, { color: theme.text }]}>Only one correct answer</Text>
            {exercise.choices.map((choice, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.choice,
                  {
                    borderColor: theme.primary,
                    backgroundColor:
                      responses[id] === choice ? theme.primary + '33' : 'transparent',
                  },
                ]}
                disabled={isReadonly}
                onPress={() => setResponses({ ...responses, [id]: choice })}
              >
                <Text style={[styles.choiceText, { color: theme.text }]}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {exercise.type === 'open' && (
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.primary, backgroundColor: theme.card },
            ]}
            multiline
            editable={!isReadonly}
            placeholder="Write your answer here..."
            placeholderTextColor={theme.text + '88'}
            value={responses[id] || ''}
            onChangeText={(text) => setResponses({ ...responses, [id]: text })}
          />
        )}
      </View>
    );
  };

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const getTimeColor = () => {
    const tolerance = assessment?.tolerance_time ?? 1;
    const total = tolerance * 3600000;
    const ratio = remainingTime / total;

    if (ratio > 0.5) return theme.text;
    if (ratio > 0.2) return '#f0ad4e';
    return '#dc3545';
  };

  if (!assessment || !currentExercise) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.counter, { color: theme.text }]}>
          Exercise {index + 1} of {Object.keys(assessment.exercises).length}
        </Text>
      </View>

      {isStudent && (
        <Text style={[styles.timer, { color: getTimeColor() }]}>
          Time remaining: {formatTime(remainingTime)}
        </Text>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderExercise(currentExercise, currentExerciseId)}
      </ScrollView>

      <View style={styles.navContainer}>
        {index > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={() => setIndex(index - 1)}>
            <Text style={styles.navButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        {index < Object.keys(assessment.exercises).length - 1 ? (
          <TouchableOpacity style={styles.navButton} onPress={() => setIndex(index + 1)}>
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          isStudent && (
            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: '#FFFFFF', borderColor: '#339CFF', borderWidth: 2 },
              ]}
              onPress={handleSubmit}
            >
              <Text style={[styles.navButtonText, { color: '#339CFF' }]}>Submit</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md * 2,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: spacing.sm,
  },
  backArrow: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
  },
  counter: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: fonts.size.md,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.md,
  },
  exerciseContainer: {
    marginBottom: spacing.xl,
  },
  enunciate: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  link: {
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  notice: {
    marginBottom: spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  choice: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  choiceText: {
    fontSize: fonts.size.md,
    textAlign: 'center',
  },
  input: {
    minHeight: 100,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fonts.size.md,
    marginTop: spacing.md,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.lg * 2,
  },
  navButton: {
    backgroundColor: '#339CFF',
    padding: spacing.md,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fonts.size.md,
  },
});

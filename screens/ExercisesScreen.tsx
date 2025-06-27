import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Linking,
  ActivityIndicator,
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
} from '../services/assessmentsApi';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import { shareHtmlAsPdf } from '../utils/pdfUtils';
import { generateAssessmentHtml } from '../utils/generateAssessmentHtml';
import { FileText } from 'lucide-react-native';

export default function ExercisesScreen() {
  const { assessmentId, courseId, role } = useLocalSearchParams<{
    assessmentId: string;
    courseId: string;
    role: string;
  }>();
  const { user, authToken } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isStudent = role === 'Student';
  const isReadonly = !isStudent;
  const STORAGE_KEY = `startTime_${courseId}_${assessmentId}`;
  const RESPONSES_KEY = `responses_${user?.uuid}_${courseId}_${assessmentId}`;

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!assessmentId || !courseId || !authToken) return;

      try {
        const res = await getAssessmentById(assessmentId, authToken);
        setAssessment(res);

        const savedResponses = await AsyncStorage.getItem(RESPONSES_KEY);
        if (savedResponses) {
          setResponses(JSON.parse(savedResponses));
        }

        const shouldTime = isStudent && res.type === 'Exam' && (res.toleranceTime ?? 0) > 0;
        if (shouldTime) {
          const durationMs = res.toleranceTime * 60 * 60 * 1000;
          const savedStart = await AsyncStorage.getItem(STORAGE_KEY);
          let startTime = savedStart ? parseInt(savedStart, 10) : Date.now();

          if (!savedStart) {
            await AsyncStorage.setItem(STORAGE_KEY, startTime.toString());
          }

          const timePassed = Date.now() - startTime;
          const remaining = durationMs - timePassed;
          setRemainingTime(remaining > 0 ? remaining : 0);
        }
      } catch (error) {
        //console.error('Error fetching assessment:', error);
      }
    };

    fetchAssessment();
  }, [assessmentId, courseId, authToken]);

  useEffect(() => {
    const saveResponses = async () => {
      if (!RESPONSES_KEY) return;
      try {
        await AsyncStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
      } catch (error) {
        //console.error('Error saving partial responses:', error);
      }
    };

    saveResponses();
  }, [responses]);

  useEffect(() => {
    const shouldRunTimer =
      isStudent &&
      !submitted &&
      assessment?.type === 'Exam' &&
      (assessment.toleranceTime ?? 0) > 0 &&
      remainingTime > 0;

    if (!shouldRunTimer) return;

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [remainingTime, isStudent, submitted, assessment]);

    const handleSubmit = () => {
    if (!assessment || !user || !authToken) return;
    
    setLoading(true); 

    Alert.alert(
      'Confirm submission',
      'This is final. Are you sure you want to submit?',
      [
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await submitAssessment(assessment.id, user.uuid, Object.values(responses), authToken);
              await AsyncStorage.multiRemove([STORAGE_KEY, RESPONSES_KEY]);
              setSubmitted(true);
              Alert.alert('Submitted', 'Your answers have been submitted.');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'There was a problem submitting your answers.');
            } finally {
              setLoading(false);  
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };


  const handleAutoSubmit = async () => {
  if (!assessment || !user || !authToken) return;

  setLoading(true);  

  try {
    await submitAssessment(assessment.id, user.uuid, Object.values(responses), authToken);
    await AsyncStorage.multiRemove([STORAGE_KEY, RESPONSES_KEY]);
    setSubmitted(true);
    Alert.alert("Time's up", 'Your answers were submitted automatically.');
    router.back();
  } catch (error) {
    Alert.alert('Error', 'Failed to auto-submit your answers.');
  } finally {
    setLoading(false);  
  }
};


  const handleExportPdf = async () => {
    if (!assessment) return;
    try {
      const html = await generateAssessmentHtml(assessment);
      await shareHtmlAsPdf(html);
    } catch (error) {
      //console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not generate PDF.');
    }
  };

  const currentExercise = assessment?.exercises?.[index];

  const renderExercise = (exercise: AssessmentExercise, id: string) => (
    <View key={id} style={styles.exerciseContainer}>
      <Text style={[styles.enunciate, { color: theme.text }]}>{exercise.enunciate}</Text>
      {exercise.link && (
        <TouchableOpacity onPress={() => Linking.openURL(exercise.link!)}>
          <Text style={[styles.link, { color: theme.primary, textDecorationLine: 'underline' }]}>
            📎 Attached Resource
          </Text>
        </TouchableOpacity>
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
                  backgroundColor: responses[id] === choice ? theme.primary + '33' : 'transparent',
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
            {
              color: theme.text,
              borderColor: theme.primary,
              backgroundColor: theme.card,
            },
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

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const getTimeColor = () => {
    if (!assessment || assessment.type !== 'Exam' || (assessment.toleranceTime ?? 0) === 0) {
      return 'transparent';
    }
    const total = assessment.toleranceTime * 3600000;
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
        <Text style={[styles.counter, { color: theme.text }]}>Exercise {index + 1} of {assessment.exercises.length}</Text>
        <TouchableOpacity onPress={handleExportPdf} style={styles.exportButton}>
          <FileText size={24} stroke="#339CFF" />
        </TouchableOpacity>
      </View>

      {isStudent && assessment.type === 'Exam' && (assessment.toleranceTime ?? 0) > 0 && (
        <Text style={[styles.timer, { color: getTimeColor() }]}>
          Time remaining: {formatTime(remainingTime)}
        </Text>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderExercise(currentExercise, index.toString())}
      </ScrollView>

      <View style={styles.navContainer}>
        {index > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={() => setIndex(index - 1)}>
            <Text style={styles.navButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        {index < assessment.exercises.length - 1 ? (
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
            disabled={loading}  
          >
            {loading ? (
              <ActivityIndicator size="small" color="#339CFF" />  
            ) : (
              <Text style={[styles.navButtonText, { color: '#339CFF' }]}>Submit</Text>
            )}
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
  exportButton: {
    position: 'absolute',
    right: 0,
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

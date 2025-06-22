import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getAssessmentById,
  getUserSubmissionForAssessment,
  AssessmentExercise,
  Correction,
  mockSubmitCorrection,
} from '../services/assessmentsApi';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { FileText } from 'lucide-react-native';

export default function CorrectionExerciseScreen() {
  const { assessmentId, userId } = useLocalSearchParams<{ assessmentId: string; userId: string }>();
  const { user, authToken } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const [assessment, setAssessment] = useState<any | null>(null);
  const [submission, setSubmission] = useState<any | null>(null);
  const [index, setIndex] = useState(0);
  const [comments, setComments] = useState<string[]>([]);
  const [finalNote, setFinalNote] = useState<number>(0);
  const [finalComment, setFinalComment] = useState('');

  const totalPages = assessment ? assessment.exercises.length + 1 : 0;
  const isLastPage = index === totalPages - 1;

  useEffect(() => {
    const fetchData = async () => {
      if (!assessmentId || !userId || !authToken) return;
      try {
        const a = await getAssessmentById(assessmentId, authToken);
        const s = await getUserSubmissionForAssessment(assessmentId, userId, authToken);
        setAssessment(a);
        setSubmission(s);
        setComments(Array(a.exercises.length).fill(''));
      } catch (error) {
        console.error('Error loading correction data:', error);
        Alert.alert('Error', 'Could not load the assessment or submission.');
      }
    };
    fetchData();
  }, [assessmentId, userId, authToken]);

  const currentExercise: AssessmentExercise | null = !isLastPage ? assessment?.exercises?.[index] : null;
  const studentAnswer = submission?.answers?.[index]?.answer || '';

  const handleSubmitCorrection = async () => {
    if (!assessment || !submission || !user || !authToken) return;

    const correction: Omit<Correction, 'aiSummary'> = {
      assessmentId: assessment.id,
      userId: submission.userId,
      commentsPerExercise: comments,
      finalNote,
      finalComment,
    };

    try {
      await mockSubmitCorrection(assessment.id, submission.userId, correction, user.uuid);
      Alert.alert('✅ Correction submitted', 'Feedback was saved.');
      router.back();
    } catch (error) {
      console.error('Error submitting correction:', error);
      Alert.alert('Error', 'Could not submit the correction.');
    }
  };

  const renderExercise = (exercise: AssessmentExercise, idx: number) => {
    const isCorrect = exercise.type === 'multiple_choice' && studentAnswer === exercise.answer;
    return (
      <View key={idx} style={{ flex: 1, justifyContent: 'center', minHeight: '100%' }}>
        <Text style={[styles.enunciate, { color: theme.text }]}>{exercise.enunciate}</Text>

        {exercise.link && (
          <TouchableOpacity onPress={() => Linking.openURL(exercise.link!)}>
            <Text style={[styles.link, { color: theme.primary }]}>📎 Attached Resource</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.label, { color: theme.text, marginTop: spacing.lg }]}>Student answer:</Text>

        {exercise.type === 'multiple_choice' ? (
          <>
            <Text
              style={{
                color: isCorrect ? 'green' : 'red',
                marginTop: spacing.sm,
                marginBottom: spacing.sm,
                textAlign: 'center',
              }}
            >
              {isCorrect ? '✅ The student answered correctly!' : '❌ The student answered incorrectly.'}
            </Text>
            {exercise.choices?.map((choice, i) => {
              const isSelected = studentAnswer === choice;
              const isRight = choice === exercise.answer;
              return (
                <View
                  key={i}
                  style={{
                    borderWidth: 1.5,
                    borderColor: isSelected ? (isRight ? 'green' : 'red') : theme.border,
                    backgroundColor: isRight ? '#a4f5a4' : isSelected ? '#f5a4a4' : 'transparent',
                    padding: spacing.md,
                    borderRadius: 8,
                    marginVertical: spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      color: isRight ? '#000' : theme.text,
                      textAlign: 'center',
                    }}
                  >
                    {choice}
                  </Text>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <Text style={[styles.answer, { color: theme.text, marginBottom: spacing.lg }]}>  
              {studentAnswer || 'No response'}
            </Text>
            <Text style={[styles.label, { color: theme.text }]}>Your comment:</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.card }]}
              multiline
              placeholder="Type your comment here..."
              placeholderTextColor={theme.text + '88'}
              value={comments[idx]}
              onChangeText={(text) => {
                const updated = [...comments];
                updated[idx] = text;
                setComments(updated);
              }}
            />
          </>
        )}
      </View>
    );
  };

  if (!assessment || !submission) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.counter, { color: theme.text }]}>  
          {isLastPage ? 'Final feedback' : `Exercise ${index + 1} of ${assessment.exercises.length}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', minHeight: '0%' }}>
        {!isLastPage && currentExercise && renderExercise(currentExercise, index)}

        {isLastPage && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[styles.label, { color: theme.text }]}>Final grade (0–10)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.card }]}
              keyboardType="numeric"
              placeholder="e.g. 8.5"
              value={String(finalNote)}
              onChangeText={(t) => setFinalNote(parseFloat(t) || 0)}
            />
            <Text style={[styles.label, { color: theme.text, marginTop: spacing.md }]}>Final comment</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.card }]}
              multiline
              placeholder="Overall feedback..."
              placeholderTextColor={theme.text + '88'}
              value={finalComment}
              onChangeText={setFinalComment}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.navContainer}>
        {index > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={() => setIndex(index - 1)}>
            <Text style={styles.navButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        {!isLastPage ? (
          <TouchableOpacity style={styles.navButton} onPress={() => setIndex(index + 1)}>
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: '#FFFFFF', borderColor: '#339CFF', borderWidth: 2 }]}
            onPress={handleSubmitCorrection}
          >
            <Text style={[styles.navButtonText, { color: '#339CFF' }]}>Submit Correction</Text>
          </TouchableOpacity>
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
  enunciate: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  answer: {
    fontSize: fonts.size.md,
    marginTop: 25,
  },
  link: {
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  input: {
    minHeight: 100,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fonts.size.md,
    marginTop: spacing.sm,
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
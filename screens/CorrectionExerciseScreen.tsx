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
  Image,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getAssessmentById,
  getUserSubmissionForAssessment,
  getCorrection,
  submitCorrection,
  AssessmentExercise,
  Correction,
  Assessment,
  SubmittedAnswer,
} from '../services/assessmentsApi';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';



export default function CorrectionExerciseScreen() {
  const { assessmentId, userId, role } = useLocalSearchParams<{
    assessmentId: string;
    userId: string;
    role: string;
  }>();
  const { user, authToken } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const isReadonly = role === 'Student';

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submission, setSubmission] = useState<any | null>(null);
  const [index, setIndex] = useState(0);
  const [comments, setComments] = useState<string[]>([]);
  const [finalNote, setFinalNote] = useState<number>(0);
  const [finalComment, setFinalComment] = useState('');
  const [correctionLoaded, setCorrectionLoaded] = useState(false);
  const [showClassyModal, setShowClassyModal] = useState(false);

  const totalPages = assessment ? assessment.exercises.length + 1 : 0;
  const isLastPage = index === totalPages - 1;
   console.log('submission:', submission);
  useEffect(() => {
    const fetchData = async () => {
      if (!assessmentId || !userId || !authToken) return;
      try {
        const a = await getAssessmentById(assessmentId, authToken);
        const s = await getUserSubmissionForAssessment(assessmentId, userId, authToken);
        setAssessment(a);
        setSubmission(s);

        const correction = await getCorrection(assessmentId, userId, authToken);
        if (correction) {
          setComments(correction.corrections ?? a.exercises.map(() => ''));
          setFinalNote(correction.note ?? 0);
          setFinalComment(correction.feedback ?? '');
        } else {
          setComments(a.exercises.map(() => ''));
        }
        setCorrectionLoaded(true);
      } catch (error) {
        //console.error('Error loading data:', error);
        Alert.alert('Error', 'Could not load the assessment or submission.');
      }
    };
    fetchData();
  }, [assessmentId, userId, authToken]);

  const currentExercise: AssessmentExercise | null =
    !isLastPage && assessment?.exercises?.[index] ? assessment.exercises[index] : null;
  const studentAnswer = submission?.answers?.[index]?.answer || '';

  const handleSubmitCorrection = async () => {
    if (!assessment || !submission || !user || !authToken) return;
    if (!finalComment.trim()) {
      Alert.alert('Comment required', 'Please write a final comment before submitting.');
      return;
    }

    const trimmedComments = submission.answers.map((_: SubmittedAnswer, i: number) => {
      const ex = assessment.exercises[i];
      return ex?.type === 'multiple_choice' ? '' : comments[i] || '';
    });

    const correction: Correction = {
      teacherId: user.uuid,
      corrections: trimmedComments,
      note: finalNote,
      feedback: finalComment,
    };

    try {
      await submitCorrection(assessment.id, submission.userId, correction, authToken);
      Alert.alert('✅ Correction submitted', 'Feedback was saved.');
      router.back();
    } catch (error) {
      //console.error('Error submitting correction:', error);
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
                  backgroundColor: isSelected
                    ? isRight
                      ? '#a4f5a4'
                      : '#f5a4a4'
                    : isRight
                    ? '#e0ffd6'
                    : 'transparent',
                  padding: spacing.md,
                  borderRadius: 8,
                  marginVertical: spacing.xs,
                }}
              >
                <Text style={{ color: isRight ? '#000' : theme.text, textAlign: 'center' }}>
                  {choice}
                </Text>
              </View>
            );
          })}
          <Text style={[styles.label, { color: theme.text, marginTop: spacing.sm }]}>
            Correct answer: {exercise.answer}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.answer, { color: theme.text, marginBottom: spacing.lg }]}>
            {studentAnswer || 'No response'}
          </Text>
          <Text style={[styles.label, { color: theme.text }]}>Exercise comment:</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.primary,
                backgroundColor: theme.card,
              },
            ]}
            editable={!isReadonly}
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


  if (!assessment || !submission || !correctionLoaded) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.counter, { color: theme.text }]}>
          {isLastPage ? 'Final feedback' : `Exercise ${index + 1} of ${assessment.exercises.length}`}
        </Text>

        {isReadonly && (
          <TouchableOpacity
            onPress={() => setShowClassyModal(true)}
            style={{ position: 'absolute', right: 0, padding: spacing.sm }}
          >
            <Image source={require('../assets/icons/classy-logo.png')} style={{ width: 32, height: 32 }} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', minHeight: '0%' }}>
        {!isLastPage && currentExercise && renderExercise(currentExercise, index)}

        {isLastPage && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[styles.label, { color: theme.text }]}>Final grade (1–10)</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={finalNote}
              disabled={isReadonly}
              onValueChange={(value) => setFinalNote(value)}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
            />
            <Text style={{ textAlign: 'center', marginBottom: spacing.md, color: theme.text }}>
              Selected score: {finalNote}
            </Text>

            <Text style={[styles.label, { color: theme.text }]}>Final comment</Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.primary, backgroundColor: theme.card },
              ]}
              multiline
              editable={!isReadonly}
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
          !isReadonly && (
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#339CFF',
                  borderWidth: 2,
                },
              ]}
              onPress={handleSubmitCorrection}
            >
              <Text style={[styles.navButtonText, { color: '#339CFF' }]}>Submit Correction</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {isReadonly && (
        <Modal visible={showClassyModal} transparent animationType="fade">
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
          }}>
            <View style={{
              width: '95%',
              backgroundColor: theme.card,
              borderRadius: 16,
              padding: spacing.lg,
              alignItems: 'center',
            }}>
              <Image source={require('../assets/icons/classy-logo.png')} style={{ width: 48, height: 48, marginBottom: spacing.md }} />
              <Text style={[styles.label, { color: theme.text, textAlign: 'center', marginBottom: spacing.md }]}>
                {submission?.AIFeedback ?? 'No Classy feedback available.'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
                <Text style={{ color: theme.text, marginRight: spacing.sm }}>powered by</Text>
                <Image source={require('../assets/icons/gemini-logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
              <TouchableOpacity
                onPress={() => setShowClassyModal(false)}
                style={{ marginTop: spacing.lg }}
              >
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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

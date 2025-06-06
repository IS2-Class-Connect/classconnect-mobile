import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import {
  Enrollment,
   createCourseFeedback,
   createStudentFeedback,
   getAllCourseFeedbacks
} from '../../../services/coursesApi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

interface User {
  uuid: string;
  name: string;
  urlProfilePhoto?: string;
}

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string, studentId?: string) => Promise<void>;
  mode: 'self' | 'professor';
  students?: Enrollment[];
  users?: User[];
  courseId?: number;
  courseName?: string;
}

// Reusable feedback form component used both by students and professors
const FeedbackForm = ({
  rating,
  setRating,
  feedbackText,
  setFeedbackText,
  onCancel,
  onSubmit,
  theme,
}: {
  rating: number;
  setRating: (r: number) => void;
  feedbackText: string;
  setFeedbackText: (t: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  theme: ReturnType<typeof useTheme>;
}) => {
  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={36}
            color={theme.warning}
            style={{ marginHorizontal: 6 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <>
      {renderStars()}
      <TextInput
        multiline
        placeholder="Optional feedback..."
        placeholderTextColor={theme.text + '99'}
        style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
        value={feedbackText}
        onChangeText={setFeedbackText}
      />
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.border }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.success }]}
          onPress={onSubmit}
        >
          <Text style={[styles.submitText, { color: theme.background }]}>Submit</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default function FeedbackModal({
  visible,
  onClose,
  onSubmit,
  mode,
  students = [],
  users = [],
  courseId,
  courseName,
}: FeedbackModalProps) {
  const theme = useTheme();
  const { authToken } = useAuth();

  // State for feedback form inputs
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  // State for professor: selected student and whether to show feedback form
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  // View mode for professor tabs: view feedbacks, give feedback, or classy summary
  const [viewMode, setViewMode] = useState<'showFeedbacks' | 'giveFeedback' | 'classy'>('showFeedbacks');
  // Search input for filtering students/feedbacks
  const [search, setSearch] = useState('');
  // Toggle to show classy summary
  const [showClassyText, setShowClassyText] = useState(false);

  const [classySummary, setClassySummary] = useState<string | null>(null);


  // Reset all state when modal closes
  useEffect(() => {
    if (!visible) {
      setRating(0);
      setFeedbackText('');
      setSelectedStudentId(null);
      setShowFeedbackForm(false);
      setViewMode('showFeedbacks');
      setSearch('');
      setShowClassyText(false);
    }
  }, [visible]);

  // Submit handler for feedback form
  const handleSubmit = async () => {
  if (rating === 0) {
    Alert.alert('Validation', 'Please select a rating (1-5 stars).');
    return;
  }
  try {
    if (mode === 'self') {
      // 🧑‍🎓 Estudiante da feedback al curso
      if (!courseId || !authToken) return;
      await createCourseFeedback(courseId, users[0]?.uuid || '', {
        courseNote: rating,
        courseFeedback: feedbackText,
      }, authToken);
      Alert.alert('Success', 'Thank you for your feedback!');
      onClose();
    } else if (
      mode === 'professor' &&
      selectedStudentId &&
      courseId &&
      authToken
    ) {
      // 🧑‍🏫 Docente da feedback al estudiante
      await createStudentFeedback(courseId, selectedStudentId, {
        studentNote: rating,
        studentFeedback: feedbackText,
        teacherId: users[0]?.uuid || '', // puedes cambiar esto por `authContext.user.uuid` si lo tenés disponible acá
      }, authToken);
      Alert.alert('Success', 'Feedback sent to student.');
      setShowFeedbackForm(false);
      setSelectedStudentId(null);
      setRating(0);
      setFeedbackText('');
    }
  } catch (e) {
    Alert.alert('Error', 'Failed to send feedback.');
    console.error(e);
  }
};


  // Helper to get user info from ID
  const getUserById = (userId: string): User | undefined => users.find((u) => u.uuid === userId);

  // Filter to only students (exclude assistants etc)
  const studentsOnly = students.filter((s) => s.role === 'STUDENT');

  // Filter students by search text matching name or feedback
  const filteredStudents = studentsOnly.filter((s) => {
    const user = getUserById(s.userId);
    const feedback = s.student_feedback?.toLowerCase() || '';
    return (
      (user?.name.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      feedback.includes(search.toLowerCase())
    );
  });

  useEffect(() => {
  const fetchClassySummary = async () => {
    if (!authToken || !courseId || viewMode !== 'classy') return;
    try {
      const res = await getAllCourseFeedbacks(courseId, authToken);
      setClassySummary(res?.summary ?? 'No summary available yet.');
    } catch (err) {
      console.error('Error loading summary:', err);
      setClassySummary('Failed to load summary.');
    }
  };

  fetchClassySummary();
}, [viewMode, courseId, authToken]);


  // The student currently selected for feedback (professor mode)
  const userForFeedback = selectedStudentId ? getUserById(selectedStudentId) : null;

  if (!visible) return null;

  // --- STUDENT MODE ---
  if (mode === 'self') {
    // Only show simple feedback form for the course (no tabs or lists)
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Give Feedback to Course: {courseName}
            </Text>

            <FeedbackForm
              rating={rating}
              setRating={setRating}
              feedbackText={feedbackText}
              setFeedbackText={setFeedbackText}
              onCancel={onClose}
              onSubmit={handleSubmit}
              theme={theme}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // --- PROFESSOR/ASSISTANT MODE ---
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: theme.background + 'CC' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {courseName} - Feedback
          </Text>

          {/* Search input */}
          <TextInput
            placeholder="Search by student or feedback..."
            placeholderTextColor={theme.text + '99'}
            style={[styles.searchInput, { borderColor: theme.border, color: theme.text }]}
            value={search}
            onChangeText={setSearch}
          />

          {/* Tabs: View Feedbacks, Give Feedback, Classy */}
          <View style={styles.toggleButtonsRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'showFeedbacks' && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setViewMode('showFeedbacks');
                setShowFeedbackForm(false);
                setSelectedStudentId(null);
                setRating(0);
                setFeedbackText('');
                setShowClassyText(false);
              }}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  { color: viewMode === 'showFeedbacks' ? theme.background : theme.primary },
                ]}
              >
                View Feedbacks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'giveFeedback' && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setViewMode('giveFeedback');
                setShowFeedbackForm(false);
                setSelectedStudentId(null);
                setRating(0);
                setFeedbackText('');
                setShowClassyText(false);
              }}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  { color: viewMode === 'giveFeedback' ? theme.background : theme.primary },
                ]}
              >
                Give Feedback
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'classy' && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setViewMode('classy');
                setShowClassyText(true);
                setShowFeedbackForm(false);
                setSelectedStudentId(null);
              }}
            >
              <Image
                source={require('../../../assets/icons/classy-logo.png')}
                style={styles.classyLogoSmall}
              />
              <Text
                style={[
                  styles.toggleButtonText,
                  { color: viewMode === 'classy' ? theme.background : theme.primary },
                ]}
              >
                Classy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab content */}

          {/* View Feedbacks: list feedbacks with stars, comments, avatars */}
          {viewMode === 'showFeedbacks' && (
            <FlatList
              data={filteredStudents.filter(
                (s) => s.student_note !== undefined || s.student_feedback !== undefined
              )}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => {
                const user = getUserById(item.userId);
                if (!user) return null;

                return (
                  <View style={styles.feedbackRow}>
                    {user.urlProfilePhoto ? (
                      <Image source={{ uri: user.urlProfilePhoto }} style={styles.studentAvatar} />
                    ) : (
                      <View style={[styles.studentAvatarPlaceholder, { backgroundColor: theme.border }]}>
                        <Text style={[styles.studentAvatarText, { color: theme.text }]}>
                          {user.name[0]}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={[styles.studentName, { color: theme.text }]}>{user.name}</Text>
                      <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Ionicons
                            key={i}
                            name={i <= (item.student_note ?? 0) ? 'star' : 'star-outline'}
                            size={24}
                            color={theme.warning}
                            style={{ marginHorizontal: 2 }}
                          />
                        ))}
                      </View>
                      <Text style={{ color: theme.text, fontStyle: 'italic' }}>
                        "{item.student_feedback || 'No comment'}"
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Give Feedback: list students to pick from, then show feedback form */}
          {viewMode === 'giveFeedback' && (
            <>
              {!showFeedbackForm && (
                <FlatList
                  data={filteredStudents}
                  keyExtractor={(item) => item.userId}
                  renderItem={({ item }) => {
                    const user = getUserById(item.userId);
                    if (!user) return null;
                    return (
                      <View style={styles.feedbackRow}>
                        {user.urlProfilePhoto ? (
                          <Image source={{ uri: user.urlProfilePhoto }} style={styles.studentAvatar} />
                        ) : (
                          <View style={[styles.studentAvatarPlaceholder, { backgroundColor: theme.border }]}>
                            <Text style={[styles.studentAvatarText, { color: theme.text }]}>
                              {user.name[0]}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.studentName, { color: theme.text }]}>{user.name}</Text>
                        <TouchableOpacity
                          style={[styles.giveFeedbackBtn, { backgroundColor: theme.primary }]}
                          onPress={() => {
                            setSelectedStudentId(item.userId);
                            setShowFeedbackForm(true);
                            setRating(0);
                            setFeedbackText('');
                          }}
                        >
                          <Text style={[styles.giveFeedbackBtnText, { color: theme.background }]}>Give Feedback</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              )}
              {showFeedbackForm && userForFeedback && (
                <FeedbackForm
                  rating={rating}
                  setRating={setRating}
                  feedbackText={feedbackText}
                  setFeedbackText={setFeedbackText}
                  onCancel={() => {
                    setShowFeedbackForm(false);
                    setSelectedStudentId(null);
                    setRating(0);
                    setFeedbackText('');
                  }}
                  onSubmit={handleSubmit}
                  theme={theme}
                />
              )}
            </>
          )}

          {/* Classy summary tab */}
          {viewMode === 'classy' && showClassyText && classySummary && (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[styles.summaryText, { color: theme.text, textAlign: 'center' }]}>
                <Text style={{ fontWeight: '700' }}>Curso: {courseName}</Text>
              </Text>
              <Text style={[styles.summaryText, { color: theme.text, textAlign: 'center' }]}>
                {classySummary}
              </Text>
              <View style={styles.poweredByRow}>
                <Text style={[styles.poweredByText, { color: theme.text }]}>powered by</Text>
                <Image source={require('../../../assets/icons/gemini-logo.png')} style={styles.geminiLogo} />
              </View>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: theme.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  toggleButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  toggleButtonText: {
    fontWeight: '700',
    textAlign: 'center',
    fontSize: fonts.size.sm,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    fontSize: fonts.size.sm,
  },
  classyLogoSmall: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  studentName: {
    fontSize: fonts.size.md,
    fontWeight: '600',
    flex: 1,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  studentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    fontWeight: '700',
    fontSize: fonts.size.md,
  },
  giveFeedbackBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  giveFeedbackBtnText: {
    fontWeight: '600',
  },
  closeButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  closeText: {
    fontSize: fonts.size.md,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  textInput: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    fontSize: fonts.size.md,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  cancelText: {
    fontWeight: '700',
  },
  submitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  submitText: {
    fontWeight: '700',
  },
  summaryText: {
    fontSize: fonts.size.md,
    marginVertical: spacing.sm,
    textAlign: 'center',
  },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  poweredByText: {
    fontSize: fonts.size.sm,
    marginRight: spacing.xs,
  },
  geminiLogo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
});

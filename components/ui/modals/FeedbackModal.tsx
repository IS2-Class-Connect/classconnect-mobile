import React, { useEffect, useState, useMemo } from 'react';
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
  getAllCourseFeedbacks,
  getStudentFeedback
} from '../../../services/coursesApi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Markdown from 'react-native-markdown-display';
import { ActivityIndicator } from 'react-native';


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
  const { authToken, user } = useAuth();

  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [viewMode, setViewMode] = useState<'showFeedbacks' | 'giveFeedback' | 'classy'>('showFeedbacks');
  const [search, setSearch] = useState('');
  const [showClassyText, setShowClassyText] = useState(false);
  const [classySummary, setClassySummary] = useState<string | null>(null);
  const [courseFeedbacks, setCourseFeedbacks] = useState<
  { studentId: string; courseNote: number; courseFeedback: string }[]
>([]);
const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
const [loadingClassy, setLoadingClassy] = useState(false);
const [studentsWithFeedback, setStudentsWithFeedback] = useState<string[]>([]);
const [checkingStudentFeedbacks, setCheckingStudentFeedbacks] = useState(false);



  useEffect(() => {
  const fetchAllFeedbacks = async () => {
    if (!authToken || !courseId || viewMode !== 'showFeedbacks') return;
    setLoadingFeedbacks(true);
    try {
      const res = await getAllCourseFeedbacks(courseId, authToken);
      setCourseFeedbacks(res.feedbacks);
    } catch (err) {
      //console.error('Error loading feedbacks:', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };
  fetchAllFeedbacks();
}, [viewMode, courseId, authToken]);




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

  useEffect(() => {
  if (viewMode === 'giveFeedback') {
    setLoadingFeedbacks(false);
  }
}, [viewMode]);


  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Validation', 'Please select a rating (1-5 stars).');
      return;
    }
    try {
      if (mode === 'self') {
        if (!user?.uuid || !authToken || !courseId) return;
        await createCourseFeedback(courseId, user.uuid, {
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
        if (!user?.uuid || !authToken || !courseId) return;
        await createStudentFeedback(courseId, selectedStudentId, {
          studentNote: rating,
          studentFeedback: feedbackText,
          teacherId: user.uuid,
        }, authToken);
        Alert.alert('Success', 'Feedback sent to student.');
        setShowFeedbackForm(false);
        setSelectedStudentId(null);
        setRating(0);
        setFeedbackText('');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send feedback.');
      //console.error(e);
    }
  };

  const getUserById = (userId: string): User | undefined => users.find((u) => u.uuid === userId);
  const studentsOnly = useMemo(() => students.filter((s) => s.role === 'STUDENT'), [students]);
  const filteredStudents = studentsOnly.filter((s) => {
    const user = getUserById(s.userId);
    return user?.name.toLowerCase().includes(search.toLowerCase()) ?? false;
  });

  
  const feedbackListWithUsers = courseFeedbacks
  .map((fb) => {
    const user = getUserById(fb.studentId);
    return user ? { ...fb, user } : null;
  })
  .filter((entry): entry is { studentId: string; courseNote: number; courseFeedback: string; user: User } => !!entry);



  useEffect(() => {
  const fetchGivenFeedbacks = async () => {
    if (!authToken || !courseId || viewMode !== 'giveFeedback') return;

    setCheckingStudentFeedbacks(true);

    try {
  const promises = studentsOnly.map(async (enrollment) => {
    try {
      const feedback = await getStudentFeedback(courseId, enrollment.userId, authToken);
      
      // If feedback exists and includes a studentNote, return the studentId
      if (feedback?.studentNote) {
        return enrollment.userId;
      }

      // Feedback exists but has no rating – ignore
      return null;
    } catch (e: any) {
      // If it's a 404, it means there's no feedback yet – expected, ignore
      if (e?.response?.status === 404) {
        return null;
      }

      // Unexpected error – log it
      ////console.error(`Unexpected error for user ${enrollment.userId}:`, e);
      return null;
    }
  });

  const result = await Promise.all(promises);
  
  // Filter out nulls and save the list of users who already received feedback
  setStudentsWithFeedback(result.filter(Boolean) as string[]);
} catch (e) {
  //console.error('Error checking student feedbacks:', e);
} finally {
  setCheckingStudentFeedbacks(false);
}

  };

  fetchGivenFeedbacks();
}, [viewMode, courseId, authToken, studentsOnly]);

  useEffect(() => {
  const fetchClassySummary = async () => {
    if (!authToken || !courseId || viewMode !== 'classy') return;
    setLoadingClassy(true);
    try {
      const res = await getAllCourseFeedbacks(courseId, authToken);
      setClassySummary(res?.summary ?? 'No summary available yet.');
    } catch (err) {
      //console.error('Error loading summary:', err);
      setClassySummary('Failed to load summary.');
    } finally {
      setLoadingClassy(false);
    }
  };
  fetchClassySummary();
}, [viewMode, courseId, authToken]);

  const userForFeedback = selectedStudentId ? getUserById(selectedStudentId) : null;

  if (!visible) return null;

  if (mode === 'self') {
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
              setLoadingFeedbacks(true);
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
              setLoadingFeedbacks(true);
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
              setLoadingClassy(true);
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

{viewMode === 'showFeedbacks' && (
  <>
    {loadingFeedbacks ? (
      <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
  <ActivityIndicator size="large" color={theme.primary} />
  <Text style={{ color: theme.text, marginTop: spacing.sm }}>Loading feedbacks...</Text>
</View>

      
    ) : (
      <FlatList
        data={feedbackListWithUsers}
        keyExtractor={(item) => item.studentId}
        renderItem={({ item }) => {
          const user = item.user;
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
                      name={i <= item.courseNote ? 'star' : 'star-outline'}
                      size={24}
                      color={theme.warning}
                      style={{ marginHorizontal: 2 }}
                    />
                  ))}
                </View>
                <Text style={{ color: theme.text, fontStyle: 'italic' }}>
                  "{item.courseFeedback || 'No comment'}"
                </Text>
              </View>
            </View>
          );
        }}
      />
    )}
  </>
)}

{viewMode === 'giveFeedback' && (
  <>
    {!showFeedbackForm && (
      <>
        {loadingFeedbacks ? (
          <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
  <ActivityIndicator size="large" color={theme.primary} />
  <Text style={{ color: theme.text, marginTop: spacing.sm }}>Loading students...</Text>
</View>

        ) : (
          <FlatList
            data={studentsOnly.filter((s) => {
              const u = getUserById(s.userId);
              return u?.name.toLowerCase().includes(search.toLowerCase()) &&
                    !studentsWithFeedback.includes(s.userId);
            })}

            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => {
              const user = getUserById(item.userId);
              if (!user) return null;

              return (
                <TouchableOpacity
                  style={styles.feedbackRow}
                  onPress={() => {
                    setSelectedStudentId(item.userId);
                    setShowFeedbackForm(true);
                  }}
                >
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
                  </View>
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>Give Feedback</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </>
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

{viewMode === 'classy' && (
  <>
    {loadingClassy ? (
<View style={{ alignItems: 'center', marginVertical: spacing.md }}>
  <ActivityIndicator size="large" color={theme.primary} />
  <Text style={{ color: theme.text, marginTop: spacing.sm }}>Loading Classy Opinion...</Text>
</View>

    ) : showClassyText && classySummary && (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={[styles.summaryText, { color: theme.text, textAlign: 'center', fontWeight: '700' }]}>
        Curso: {courseName}
      </Text>

        <Markdown
          style={{
            body: {
              color: theme.text,
              fontSize: fonts.size.md,
              textAlign: 'center',
            },
            paragraph: {
              marginTop: 0,
              marginBottom: spacing.xs,
            },
            strong: {
              fontWeight: 'bold',
            },
            em: {
              fontStyle: 'italic',
            },
            link: {
              color: theme.primary,
              textDecorationLine: 'underline',
            },
          }}
        >
          {classySummary}
        </Markdown>
        <View style={styles.poweredByRow}>
          <Text style={[styles.poweredByText, { color: theme.text }]}>powered by</Text>
          <Image source={require('../../../assets/icons/gemini-logo.png')} style={styles.geminiLogo} />
        </View>
      </View>
    )}
  </>
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

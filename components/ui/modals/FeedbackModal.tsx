import React, { useState, useEffect } from 'react';
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
import { Enrollment, updateEnrollment } from '../../../services/coursesApi';
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

  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [viewMode, setViewMode] = useState<'showFeedbacks' | 'giveFeedback'>('showFeedbacks');

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setFeedbackText('');
      setSelectedStudentId(null);
      setShowFeedbackForm(false);
      setViewMode('showFeedbacks');
    }
  }, [visible]);

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Validation', 'Please select a rating (1-5 stars).');
      return;
    }
    try {
      if (mode === 'self') {
        await onSubmit(rating, feedbackText);
      } else if (mode === 'professor' && selectedStudentId && courseId && authToken) {
        await updateEnrollment(
          courseId,
          selectedStudentId,
          {
            teacher_note: rating,
            teacher_feedback: feedbackText || '',
          },
          authToken
        );
        Alert.alert('Success', 'Feedback sent to student.');
      }
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to send feedback.');
      console.error(e);
    }
  };

  const renderStars = (starCount: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= starCount ? 'star' : 'star-outline'}
          size={24}
          color={theme.warning}
          style={{ marginHorizontal: 2 }}
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.uuid === userId);
  };

  const studentsOnly = students.filter(s => s.role === 'STUDENT');

  if (mode === 'professor' && !showFeedbackForm) {
    if (!visible) return null;

    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {courseName} - Feedback
            </Text>

            <View style={styles.toggleButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'showFeedbacks' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setViewMode('showFeedbacks')}
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
                onPress={() => setViewMode('giveFeedback')}
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
            </View>


            {viewMode === 'showFeedbacks' ? (
              <FlatList
                data={studentsOnly.filter(s => s.student_note !== undefined || s.student_feedback !== undefined)}
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
                        <View style={{ marginTop: spacing.xs }}>
                          {renderStars(item.student_note ?? 0)}
                          <View style={[styles.feedbackCommentBox, { borderColor: theme.border }]}>
                            <Text style={[styles.feedbackText, { color: theme.text }]}>
                              “{item.student_feedback || 'No comment'}”
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <Text style={{ color: theme.text, textAlign: 'center', marginTop: spacing.md }}>
                    No feedbacks from students yet.
                  </Text>
                }
                style={{ marginTop: spacing.md }}
              />
            ) : (
              <FlatList
                data={studentsOnly}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => {
                  const user = getUserById(item.userId);
                  if (!user) return null;
                  return (
                    <View style={styles.studentRow}>
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
                        }}
                      >
                        <Text style={[styles.giveFeedbackBtnText, { color: theme.text }]}>Give Feedback</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <Text style={{ color: theme.text, textAlign: 'center', marginTop: spacing.md }}>
                    No students enrolled.
                  </Text>
                }
                style={{ marginTop: spacing.md }}
              />
            )}

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Feedback form for self or selected student
  const userForFeedback = selectedStudentId ? getUserById(selectedStudentId) : null;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.background + 'CC' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {mode === 'self'
              ? `Give Feedback - ${courseName}`
              : userForFeedback
              ? `Give Feedback to ${userForFeedback.name}`
              : 'Give Feedback'}
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons
                  name={i <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={theme.warning}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>
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
              onPress={() => {
                setShowFeedbackForm(false);
                setSelectedStudentId(null);
              }}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.success }]}
              onPress={handleSubmit}
            >
              <Text style={[styles.submitText, { color: theme.background }]}>Submit</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '80%',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  toggleButtonsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    justifyContent: 'center',
    gap: spacing.md,
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontWeight: '700',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  feedbackCommentBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  feedbackText: {
    fontSize: fonts.size.md,
  },
  studentRow: {
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
});

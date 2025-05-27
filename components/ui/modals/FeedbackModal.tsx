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
import { useTheme } from '../../../context/ThemeContext'; // Import theme hook

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
  users?: User[];          // User list to cross-reference names/photos
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
  const theme = useTheme(); // Use app theme colors
  const { authToken } = useAuth();

  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Reset modal state when visibility changes
  useEffect(() => {
    if (!visible) {
      setRating(0);
      setFeedbackText('');
      setSelectedStudentId(null);
      setShowFeedbackForm(false);
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

  // Render star rating buttons
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => handleStarPress(i)}>
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={36}
            color={theme.warning} // Use theme warning color (yellow star)
            style={{ marginHorizontal: 4 }}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Find user info by UUID to show name and photo
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.uuid === userId);
  };

  // Render students list for professor mode (select to give feedback)
  if (mode === 'professor' && !showFeedbackForm) {
    if (!visible) return null;

    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Students List - {courseName}
            </Text>
            <FlatList
              data={students}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => {
                const user = getUserById(item.userId);
                return (
                  <View style={styles.studentRow}>
                    {user?.urlProfilePhoto ? (
                      <Image source={{ uri: user.urlProfilePhoto }} style={styles.studentAvatar} />
                    ) : (
                      <View style={[styles.studentAvatarPlaceholder, { backgroundColor: theme.border }]}>
                        <Text style={[styles.studentAvatarText, { color: theme.text }]}>
                          {user?.name ? user.name[0] : '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.studentName, { color: theme.text }]}>
                      {user?.name ?? item.userId}
                    </Text>
                    <TouchableOpacity
                      style={[styles.giveFeedbackBtn, { backgroundColor: theme.primary }]}
                      onPress={() => {
                        setSelectedStudentId(item.userId);
                        setShowFeedbackForm(true);
                      }}
                    >
                      <Text style={styles.giveFeedbackBtnText}>Give Feedback</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={{ color: theme.text }}>No students enrolled.</Text>}
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Feedback form (for self or selected student)
  const userForFeedback = selectedStudentId ? getUserById(selectedStudentId) : null;

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
          {renderStars()}
          <TextInput
            multiline
            placeholder="Optional feedback..."
            placeholderTextColor={theme.text + '99'} // Slightly transparent placeholder text
            style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
            value={feedbackText}
            onChangeText={setFeedbackText}
          />
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.border }]}
              onPress={onClose}
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
    color: 'white',
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

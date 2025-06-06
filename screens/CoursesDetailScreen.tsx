import React, { useState, useEffect, useMemo } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Alert,
  ToastAndroid,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { sendEnrollmentEmail } from '../services/emailService';
import {
  Course,
  deleteCourse,
  enrollInCourse,
  deleteEnrollment,
  getCourseEnrollments,
  updateEnrollment,
  Enrollment,
  createCourseFeedback,
  createStudentFeedback,
} from '../services/coursesApi';
import { getAllUsers, User } from '../services/userApi';
import { useAuth } from '../context/AuthContext';
import CourseForm from '../components/ui/forms/CoursesForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import AssistantSelector from '../components/ui/modals/AssistantSelector';
import FeedbackModal from '../components/ui/modals/FeedbackModal';

export default function CourseDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, authToken } = useAuth();
  const { course } = useLocalSearchParams<{ course: string }>();

  // State for enrollments and user list (needed for feedback modal to show names/photos)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // State for user roles and UI states
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAssistant, setIsAssistant] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [showAssistantSelector, setShowAssistantSelector] = useState(false);

  // Control modal visibility for feedback
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

  // Info about the teacher (for display)
  const [teacherInfo, setTeacherInfo] = useState<User | null>(null);

  if (typeof course !== 'string') return null;

  let parsedCourse: Course;
  try {
    parsedCourse = JSON.parse(course);
  } catch {
    return null;
  }

  // Determine if current user is the teacher
  const isTeacher = parsedCourse.teacherId === user?.uuid;

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken) return;
      try {
        // Fetch enrollments for this course
        const resEnrollments = await getCourseEnrollments(parsedCourse.id, authToken);
        setEnrollments(resEnrollments);

        // Filter only student enrollments (exclude assistants, teachers)
        const studentsOnly = resEnrollments.filter(e => e.role === 'STUDENT');
        setStudentEnrollments(studentsOnly);

        // Detect if current user is enrolled or assistant, favorite status
        const mine = resEnrollments.find((e) => e.userId === user?.uuid);
        if (mine) {
          setIsEnrolled(true);
          setIsAssistant(mine.role === 'ASSISTANT');
          setIsFavorite(mine.favorite);
        } else {
          setIsEnrolled(false);
          setIsAssistant(false);
          setIsFavorite(false);
        }

        // Check if registration is closed or course is full based on student count
        const now = new Date();
        setIsClosed(new Date(parsedCourse.registrationDeadline) < now);
        setIsFull(studentsOnly.length >= parsedCourse.totalPlaces);

        // Fetch all users to show names and photos in feedback modal
        const resUsers = await getAllUsers(authToken);
        setUsers(resUsers);

        // Get teacher info from users list
        const teacher = resUsers.find((u) => u.uuid === parsedCourse.teacherId) ?? null;
        setTeacherInfo(teacher);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [authToken, parsedCourse.id, user?.uuid]);

  // Role string for display
  const role = useMemo(() => {
    if (isTeacher) return 'Professor';
    if (isAssistant) return 'Assistant';
    if (isEnrolled) return 'Student';
    return null;
  }, [isTeacher, isAssistant, isEnrolled]);

  // Status label if full or closed registration
  const statusLabel = isFull ? 'FULL' : isClosed ? 'Registration closed' : null;

  // Border color depends on role and status
  const borderColor = useMemo(() => {
    if (isTeacher) return theme.primary;
    if (isClosed || isFull) return theme.error;
    if (isAssistant || isEnrolled) return theme.primary;
    return theme.success;
  }, [theme, isTeacher, isAssistant, isEnrolled, isClosed, isFull]);

  // Calculate how many buttons to show dynamically to adapt alignment
  const buttonsCount = (() => {
    let count = 0;
    if (isTeacher || isAssistant || isEnrolled) count++; // Modules button
    if (isTeacher || isAssistant) count += 2; // Feedback + Edit buttons
    if (isTeacher) count++; // Delete button
    if (!isTeacher && !isAssistant && !isEnrolled) count++; // Enroll button
    if (!isTeacher && !isAssistant && isEnrolled) count += 2; // Feedback + Unenroll buttons
    return count;
  })();

  // --- Handlers ---

  const handleFavorite = async () => {
    if (!authToken || !user) return;
    try {
      const roleToSend = isAssistant ? 'ASSISTANT' : 'STUDENT';
      await updateEnrollment(
        parsedCourse.id,
        user.uuid,
        { favorite: !isFavorite, role: roleToSend },
        authToken
      );
      setIsFavorite(!isFavorite);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`⭐ ${!isFavorite ? 'Added to' : 'Removed from'} favorites`, ToastAndroid.SHORT);
      }
    } catch (e) {
      console.error('❌ Error updating favorite status:', e);
    }
  };

  const handleEnroll = async () => {
    if (!authToken || !user) return;
    try {
      await enrollInCourse(parsedCourse.id, user.uuid, authToken);
      setIsEnrolled(true);
      await sendEnrollmentEmail(user.uuid, user.name, parsedCourse.title, user.email);
      Alert.alert('✅ Enrolled successfully');
    } catch (e) {
      console.error('❌ Error enrolling:', e);
    }
  };

  const handleUnenroll = async () => {
    if (!authToken || !user) return;
    Alert.alert('Unenroll', 'Are you sure you want to unenroll?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unenroll',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEnrollment(parsedCourse.id, user.uuid, authToken);
            setIsEnrolled(false);
          } catch (e) {
            console.error('❌ Error unenrolling:', e);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Course', 'Are you sure you want to delete this course?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCourse(parsedCourse.id, authToken!);
            router.replace('/(tabs)/courses');
          } catch (e) {
            console.error('❌ Error deleting course:', e);
          }
        },
      },
    ]);
  };

  const handleOpenFeedbackModal = () => {
    setFeedbackModalVisible(true);
  };

  const handleCloseFeedbackModal = () => {
    setFeedbackModalVisible(false);
  };

  // Handle sending feedback, either professor to student or student to course
  const handleSendFeedback = async (rating: number, feedback: string, studentId?: string) => {
  if (!authToken || !user) return;
  try {
    if (studentId) {
      await createStudentFeedback(
        parsedCourse.id,
        studentId,
        {
          studentNote: rating,
          studentFeedback: feedback,
          teacherId: user.uuid,
        },
        authToken
      );
      Alert.alert('Success', 'Feedback sent to student!');
    } else {
      await createCourseFeedback(
        parsedCourse.id,
        user.uuid,
        {
          courseNote: rating,
          courseFeedback: feedback,
        },
        authToken
      );
      Alert.alert('Success', 'Thank you for your feedback!');
    }
    setFeedbackModalVisible(false);
  } catch (error) {
    console.error('❌ Error sending feedback:', error);
    Alert.alert('Error', 'Failed to send feedback.');
  }
};


  // --- UI Rendering ---

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.replace('/courses')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        {/* Main card */}
        <View style={[styles.cardExpanded, { borderColor, backgroundColor: theme.card }]}>
          {editing ? (
            // Show course editing form
            <CourseForm
              initialValues={parsedCourse}
              onSubmit={() => setEditing(false)}
              onCancel={() => setEditing(false)}
              submitLabel="Save Changes"
            />
          ) : (
            <>
              {/* Title and favorite star */}
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.text }]}>{parsedCourse.title}</Text>
                {(isEnrolled || isAssistant) && (
                  <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
                    <Ionicons
                      name={isFavorite ? 'star' : 'star-outline'}
                      size={26}
                      color={isFavorite ? theme.warning : theme.text}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Role badge */}
              {role && (
                <View style={[styles.roleBadge, { backgroundColor: borderColor + '20' }]}>
                  <Ionicons name="person-circle-outline" size={16} color={borderColor} />
                  <Text style={[styles.roleText, { color: borderColor }]}>{role}</Text>
                </View>
              )}

              {/* Description box */}
              <View style={[styles.descriptionBox, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.description, { color: theme.text }]}>{parsedCourse.description}</Text>
              </View>

              {/* Teacher info */}
              {teacherInfo && (
                <View style={styles.teacherRow}>
                  <Image source={{ uri: teacherInfo.urlProfilePhoto }} style={styles.avatar} />
                  <Text style={[styles.teacherName, { color: theme.text }]}>Teacher: {teacherInfo.name}</Text>
                </View>
              )}

              {/* Course meta information */}
              <View style={styles.contentArea}>
                <Text style={[styles.status, { color: theme.text }]}>
                  Places: {studentEnrollments.length}/{parsedCourse.totalPlaces}
                </Text>
                {statusLabel && (
                  <Text style={[styles.status, { color: theme.error }]}>Status: {statusLabel}</Text>
                )}
                <Text style={[styles.meta, { color: theme.text }]}>
                  Start: {new Date(parsedCourse.startDate).toDateString()}
                </Text>
                <Text style={[styles.meta, { color: theme.text }]}>
                  Deadline: {new Date(parsedCourse.registrationDeadline).toDateString()}
                </Text>
                <Text style={[styles.meta, { color: theme.text }]}>
                  End: {new Date(parsedCourse.endDate).toDateString()}
                </Text>

                {/* Action buttons - adapt alignment based on number of buttons */}
                <View
                  style={[
                    styles.iconActionsContainer,
                    { justifyContent: buttonsCount === 1 ? 'center' : 'flex-start' },
                  ]}
                >
                  {(isTeacher || isAssistant || isEnrolled) && (
                    <TouchableOpacity
                      style={styles.iconAction}
                      onPress={() => router.push(`/modules?courseId=${parsedCourse.id}&role=${role}`)}
                    >
                      <MaterialIcons name="view-module" size={36} color={theme.primary} />
                      <Text style={[styles.iconActionText, { color: theme.primary }]}>Modules</Text>
                    </TouchableOpacity>
                  )}

                  {(isTeacher || isAssistant) && (
                    <>
                      <TouchableOpacity style={styles.iconAction} onPress={handleOpenFeedbackModal}>
                        <Ionicons name="chatbubble-ellipses-outline" size={36} color={theme.primary} />
                        <Text style={[styles.iconActionText, { color: theme.primary }]}>Feedback</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.iconAction} onPress={() => setEditing(true)}>
                        <Ionicons name="create-outline" size={36} color={theme.primary} />
                        <Text style={[styles.iconActionText, { color: theme.primary }]}>Edit</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {isTeacher && (
                    <TouchableOpacity style={styles.iconAction} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={36} color={theme.error} />
                      <Text style={[styles.iconActionText, { color: theme.error }]}>Delete</Text>
                    </TouchableOpacity>
                  )}

                  {!isTeacher && !isAssistant && !isEnrolled && (
                    <TouchableOpacity
                      style={[
                        styles.iconAction,
                        (isClosed || isFull) && { opacity: 0.5 },
                      ]}
                      disabled={isClosed || isFull}
                      onPress={handleEnroll}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={36}
                        color={isClosed || isFull ? '#aaa' : theme.success}
                      />
                      <Text
                        style={[
                          styles.iconActionText,
                          { color: isClosed || isFull ? '#aaa' : theme.success },
                        ]}
                      >
                        Enroll
                      </Text>
                    </TouchableOpacity>
                  )}

                  {!isTeacher && !isAssistant && isEnrolled && (
                    <>
                      <TouchableOpacity style={styles.iconAction} onPress={handleOpenFeedbackModal}>
                        <Ionicons name="chatbubble-ellipses-outline" size={36} color={theme.primary} />
                        <Text style={[styles.iconActionText, { color: theme.primary }]}>Feedback</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.iconAction} onPress={handleUnenroll}>
                        <Ionicons name="exit-outline" size={36} color={theme.error} />
                        <Text style={[styles.iconActionText, { color: theme.error }]}>Unenroll</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Assistant selector modal */}
        <AssistantSelector
          visible={showAssistantSelector}
          onClose={() => setShowAssistantSelector(false)}
          courseId={parsedCourse.id}
          enrollments={enrollments}
          courseName={parsedCourse.title}
        />

        {/* Feedback modal */}
        <FeedbackModal
          visible={feedbackModalVisible}
          onClose={handleCloseFeedbackModal}
          onSubmit={handleSendFeedback}
          mode={isTeacher || isAssistant ? 'professor' : 'self'}
          students={isTeacher || isAssistant ? enrollments : undefined}
          users={users} // pass user list for displaying names/photos in modal
          courseId={parsedCourse.id}
          courseName={parsedCourse.title}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: spacing.lg, paddingBottom: spacing.xl },
  backButton: { marginBottom: spacing.md },
  cardExpanded: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: Dimensions.get('window').height * 0.8,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  favoriteButton: {
    padding: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fonts.size.xxl,
    fontWeight: '700',
    fontFamily: fonts.family.regular,
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  roleText: {
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  descriptionBox: {
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fonts.size.lg,
    lineHeight: 22,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  teacherName: {
    fontSize: fonts.size.md,
    fontWeight: '500',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  contentArea: {
    gap: spacing.lg,
    flexGrow: 1,
  },
  meta: {
    fontSize: fonts.size.md,
  },
  status: {
    fontSize: fonts.size.md,
    fontStyle: 'italic',
  },
  iconActionsContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  iconAction: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    maxWidth: 100,
    marginRight: spacing.md,
    marginBottom: spacing.md,
    flexGrow: 1,
  },
  iconActionText: {
    marginTop: 6,
    fontSize: fonts.size.sm,
    fontWeight: '600',
  },
});

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
import { Ionicons } from '@expo/vector-icons';
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
} from '../services/coursesApi';
import { getAllUsers } from '../services/userApi';
import { useAuth } from '../context/AuthContext';
import CourseForm from '../components/ui/forms/CoursesForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import AssistantSelector from '../components/ui/modals/AssistantSelector';

export default function CourseDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, authToken } = useAuth();
  const { course } = useLocalSearchParams<{ course: string }>();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAssistant, setIsAssistant] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [showAssistantSelector, setShowAssistantSelector] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState<any>(null);

  if (typeof course !== 'string') return null;
  let parsedCourse: Course;
  try {
    parsedCourse = JSON.parse(course);
  } catch (e) {
    return null;
  }

  const isTeacher = parsedCourse.teacherId === user?.uuid;

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken) return;
      try {
        const res = await getCourseEnrollments(parsedCourse.id, authToken);
        setEnrollments(res);
        const mine = res.find((e) => e.userId === user?.uuid);
        if (mine) {
          setIsEnrolled(true);
          setIsAssistant(mine.role === 'ASSISTANT');
          setIsFavorite(mine.favorite);
        }
        const now = new Date();
        setIsClosed(new Date(parsedCourse.registrationDeadline) < now);
        setIsFull(res.length >= parsedCourse.totalPlaces);

        const allUsers = await getAllUsers(authToken);
        const teacher = allUsers.find((u) => u.uuid === parsedCourse.teacherId);
        setTeacherInfo(teacher);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [authToken, parsedCourse.id, user?.uuid]);

  const role = useMemo(() => {
    return isTeacher ? 'Professor' : isAssistant ? 'Assistant' : isEnrolled ? 'Student' : null;
  }, [isTeacher, isAssistant, isEnrolled]);

  const statusLabel = isFull ? 'FULL' : isClosed ? 'Registration closed' : null;

  const borderColor = useMemo(() => {
    if (isTeacher) return theme.primary;
    if (isClosed || isFull) return theme.error;
    if (isAssistant || isEnrolled) return theme.primary;
    return theme.success;
  }, [theme, isTeacher, isAssistant, isEnrolled, isClosed, isFull]);

  const handleFavorite = async () => {
    if (!authToken || !user) return;
    try {
      const roleToSend = isAssistant ? 'ASSISTANT' : 'STUDENT';
      await updateEnrollment(parsedCourse.id, user.uuid, { favorite: !isFavorite, role: roleToSend }, authToken);
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
      await sendEnrollmentEmail(user.name, parsedCourse.title, user.email);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity onPress={() => router.replace('/courses')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={[styles.cardExpanded, { borderColor, backgroundColor: theme.card }]}>
          {editing ? (
            <CourseForm
              initialValues={parsedCourse}
              onSubmit={() => setEditing(false)}
              onCancel={() => setEditing(false)}
              submitLabel="Save Changes"
            />
          ) : (
            <>
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

              {role && (
                <View style={[styles.roleBadge, { backgroundColor: borderColor + '20' }]}>
                  <Ionicons name="person-circle-outline" size={16} color={borderColor} />
                  <Text style={[styles.roleText, { color: borderColor }]}>{role}</Text>
                </View>
              )}

              <View style={[styles.descriptionBox, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.description, { color: theme.text }]}>{parsedCourse.description}</Text>
              </View>

              {teacherInfo && (
                <View style={styles.teacherRow}>
                  <Image source={{ uri: teacherInfo.urlProfilePhoto }} style={styles.avatar} />
                  <Text style={[styles.teacherName, { color: theme.text }]}>Teacher: {teacherInfo.name}</Text>
                </View>
              )}

              <View style={styles.contentArea}>
                <Text style={[styles.status, { color: theme.text }]}>Places: {enrollments.length}/{parsedCourse.totalPlaces}</Text>
                {statusLabel && (
                  <Text style={[styles.status, { color: theme.error }]}>Status: {statusLabel}</Text>
                )}
                <Text style={[styles.meta, { color: theme.text }]}>Start: {new Date(parsedCourse.startDate).toDateString()}</Text>
                <Text style={[styles.meta, { color: theme.text }]}>Deadline: {new Date(parsedCourse.registrationDeadline).toDateString()}</Text>
                <Text style={[styles.meta, { color: theme.text }]}>End: {new Date(parsedCourse.endDate).toDateString()}</Text>
                {(isTeacher || isAssistant || isEnrolled) && (
                <TouchableOpacity
                  style={[styles.modulesButton, { backgroundColor: theme.primary }]}
                  onPress={() =>
                router.push(`/modules?courseId=${parsedCourse.id}&role=${role}`)}
                >
                  <Text style={styles.modulesText}>View Modules</Text>
                </TouchableOpacity>
              )}

                <View style={styles.divider} />

                {(isTeacher || isAssistant) && (
                  <View style={styles.editRow}>
                    <TouchableOpacity onPress={() => setEditing(true)}>
                      <Ionicons name="create-outline" size={28} color={theme.primary} />
                    </TouchableOpacity>
                    {isTeacher && (
                      <>
                        <TouchableOpacity onPress={() => setShowAssistantSelector(true)}>
                          <Ionicons name="person-add-outline" size={28} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete}>
                          <Ionicons name="trash-outline" size={28} color={theme.error} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}

                {!isTeacher && !isAssistant && isEnrolled && (
                  <TouchableOpacity
                    style={[styles.enrollButton, { backgroundColor: theme.error }]}
                    onPress={handleUnenroll}
                  >
                    <Text style={styles.enrollText}>Unenroll</Text>
                  </TouchableOpacity>
                )}

                {!isTeacher && !isAssistant && !isEnrolled && (
                  <TouchableOpacity
                    disabled={isClosed || isFull}
                    style={[styles.enrollButton, { backgroundColor: isClosed || isFull ? '#aaa' : theme.success }]}
                    onPress={handleEnroll}
                  >
                    <Text style={styles.enrollText}>Enroll</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        <AssistantSelector
          visible={showAssistantSelector}
          onClose={() => setShowAssistantSelector(false)}
          courseId={parsedCourse.id}
          enrollments={enrollments}
          courseName={parsedCourse.title}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  enrollButton: {
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrollText: {
    color: 'white',
    fontWeight: '600',
    fontSize: fonts.size.md,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    opacity: 0.4,
    marginVertical: spacing.lg,
  },

    modulesButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modulesText: {
    color: 'white',
    fontWeight: '600',
    fontSize: fonts.size.md,
  },

});

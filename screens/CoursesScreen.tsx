import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import {
  Course,
  getAllCourses,
  getCourseEnrollments,
  createCourse,
  Enrollment,
} from '../services/coursesApi';
import { useAuth } from '../context/AuthContext';
import CourseForm from '../components/ui/forms/CoursesForm';
import CourseCard from '../components/ui/cards/CourseCard';

export default function CoursesScreen() {
  const theme = useTheme();
  const { authToken, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [tab, setTab] = useState<'my' | 'available' | 'enrolled'>('my');

  const fetchCourses = async () => {
    if (!authToken || !user) return;
    setLoading(true);
    try {
      const allCourses = await getAllCourses(authToken);
      const allEnrollments = await Promise.all(
        allCourses.map((course) => getCourseEnrollments(course.id, authToken))
      );
      const flatEnrollments = allEnrollments.flat();
      setCourses(allCourses);
      setEnrollments(flatEnrollments);
    } catch (e) {
      console.error('❌ Error fetching courses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [authToken]);

  const handleCreateCourse = async (data: Omit<Course, 'id' | 'createdAt'>) => {
    if (!authToken || !user) return;
    const payload = { ...data, teacherId: user.uuid };
    try {
      await createCourse(payload, authToken);
      setModalVisible(false);
      await fetchCourses();
    } catch (e) {
      console.error('❌ Error creating course:', e);
    }
  };

  const enrolledCourseIds = new Set(
    enrollments.filter((e) => e.userId === user?.uuid).map((e) => e.courseId)
  );

  const filteredCourses = courses.filter((course) => {
    const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
    const isEnrolled = enrolledCourseIds.has(course.id);
    const isFull = courseEnrollments.length >= course.totalPlaces;
    const registrationClosed = new Date(course.registrationDeadline) < new Date();
    const isTeacher = course.teacherId === user?.uuid;

    if (tab === 'my') return isTeacher;
    if (tab === 'enrolled') return isEnrolled;
    return !isTeacher && !isEnrolled && !isFull && !registrationClosed;
  });

  const renderItem = ({ item }: { item: Course }) => (
    <CourseCard
      course={item}
      isTeacher={item.teacherId === user?.uuid}
      isEnrolled={enrolledCourseIds.has(item.id)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Courses</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setTab('my')} style={[styles.tab, tab === 'my' && styles.activeTab]}>
          <Text style={{ color: theme.text }}>My Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('available')} style={[styles.tab, tab === 'available' && styles.activeTab]}>
          <Text style={{ color: theme.text }}>Available</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('enrolled')} style={[styles.tab, tab === 'enrolled' && styles.activeTab]}>
          <Text style={{ color: theme.text }}>Enrolled</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() =>
          loading ? null : (
            <Text
              style={{
                color: theme.text,
                textAlign: 'center',
                marginTop: spacing.md,
              }}
            >
              No courses found.
            </Text>
          )
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.buttonPrimary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <CourseForm
                onSubmit={handleCreateCourse}
                onCancel={() => setModalVisible(false)}
                submitLabel="Create Course"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  activeTab: {
    backgroundColor: '#89B9FF',
  },
  list: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 10,
  },
});
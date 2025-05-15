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
  TextInput,
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
  const [tab, setTab] = useState<'my' | 'public' | 'enrolled' | 'favorites'>('my');
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolledSubtab, setEnrolledSubtab] = useState<'active' | 'finished'>('active');

  const fetchCourses = async () => {
    if (!authToken || !user) return;
    setLoading(true);
  
    try {
      const allCourses = await getAllCourses(authToken);
      console.log('✅ Total courses fetched:', allCourses.length);
  
      const allEnrollments = await Promise.all(
        allCourses.map(async (course) => {
          try {
            const enrollments = await getCourseEnrollments(course.id, authToken);
            console.log(`✅ Enrollments for course ID ${course.id} fetched`);
            return enrollments;
          } catch (err) {
            console.error(`❌ Error fetching enrollments for course ID ${course.id}`, err);
            console.log('🔎 Problematic course data:', course);
            return []; // Previene romper todo el flujo
          }
        })
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
    enrollments
      .filter((e) => e.userId === user?.uuid && (e.role === 'STUDENT' || e.role === 'ASSISTANT'))
      .map((e) => e.courseId)
  );

  const favoriteCourseIds = new Set(
    enrollments
      .filter((e) => e.userId === user?.uuid && e.favorite)
      .map((e) => e.courseId)
  );

  const now = new Date();

  const filteredCourses = courses.filter((course) => {
    const courseEnrollments = enrollments.filter((e) => e.courseId === course.id);
    const isEnrolled = enrolledCourseIds.has(course.id);
    const isFavorite = favoriteCourseIds.has(course.id);
    const isTeacher = course.teacherId === user?.uuid;
    const isFinished = new Date(course.endDate) < now;

    const match = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  course.description.toLowerCase().includes(searchTerm.toLowerCase());

    switch (tab) {
      case 'my':
        return isTeacher && match;
      case 'enrolled':
        if (!isEnrolled || !match) return false;
        return enrolledSubtab === 'active' ? !isFinished : isFinished;
        case 'favorites':
          const isRelated =
            isTeacher ||
            enrollments.some(
              (e) =>
                e.courseId === course.id &&
                e.userId === user?.uuid &&
                (e.role === 'ASSISTANT' || e.role === 'STUDENT')
            );
          return isFavorite && isRelated && match;        
      case 'public':
        return !isTeacher && !isEnrolled && match;
      default:
        return false;
    }
  });

  const renderItem = ({ item }: { item: Course }) => {
    const courseEnrollments = enrollments.filter((e) => e.courseId === item.id);
    const myEnrollment = courseEnrollments.find((e) => e.userId === user?.uuid);
    const isEnrolled = !!myEnrollment;
    const isAssistant = myEnrollment?.role === 'ASSISTANT';
    const isFull = courseEnrollments.length >= item.totalPlaces;
    const registrationClosed = new Date(item.registrationDeadline) < new Date();
    const isTeacher = item.teacherId === user?.uuid;

    return (
      <CourseCard
        course={item}
        isTeacher={isTeacher}
        isEnrolled={isEnrolled}
        isAssistant={isAssistant}
        isFull={isFull}
        isClosed={registrationClosed || isFull}
        enrolledCount={courseEnrollments.length}
      />
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Courses</Text>

        <View style={[styles.searchContainer, { borderColor: theme.primary }]}>
          <Ionicons name="search" size={20} color={theme.text} style={styles.searchIcon} />
          <TextInput
            placeholder="Search courses..."
            placeholderTextColor={theme.text}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity onPress={() => setTab('my')} style={[styles.tab, tab === 'my' && styles.activeTab]}>
            <Ionicons name="person-circle-outline" size={16} color="#000" />
            <Text style={styles.tabLabel}>My</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('public')} style={[styles.tab, tab === 'public' && styles.activeTab]}>
            <Ionicons name="earth-outline" size={16} color="#000" />
            <Text style={styles.tabLabel}>Public</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('enrolled')} style={[styles.tab, tab === 'enrolled' && styles.activeTab]}>
            <Ionicons name="school-outline" size={16} color="#000" />
            <Text style={styles.tabLabel}>Enrolled</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('favorites')} style={[styles.tab, tab === 'favorites' && styles.activeTab]}>
            <Ionicons name="star-outline" size={16} color="#000" />
            <Text style={styles.tabLabel}>Favorites</Text>
          </TouchableOpacity>
        </View>

        {tab === 'enrolled' && (
          <View style={styles.subtabRow}>
            <TouchableOpacity
              onPress={() => setEnrolledSubtab('active')}
              style={[styles.subtab, enrolledSubtab === 'active' && styles.activeTab]}
            >
              <Text style={styles.tabLabel}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEnrolledSubtab('finished')}
              style={[styles.subtab, enrolledSubtab === 'finished' && styles.activeTab]}
            >
              <Text style={styles.tabLabel}>Finished</Text>
            </TouchableOpacity>
          </View>
        )}

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
    </TouchableWithoutFeedback>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subtabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  subtab: {
    flex: 0.45,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  activeTab: {
    backgroundColor: '#89B9FF',
  },
  tabLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
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
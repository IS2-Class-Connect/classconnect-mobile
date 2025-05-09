import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { Course, getAllCourses, createCourse } from '../services/coursesApiMock';
import { useAuth } from '../context/AuthContext';
import CourseForm from '../components/ui/forms/CoursesForm';
import { useRouter } from 'expo-router';

export default function CoursesScreen() {
  const theme = useTheme();
  const { authToken, user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchCourses = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const result = await getAllCourses(authToken);
      setCourses(result);
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

    try {
      await createCourse({ ...data, teacherId: user.uuid }, authToken);
      setModalVisible(false);
      await fetchCourses();
    } catch (e) {
      console.error('❌ Error creating course:', e);
    }
  };

  const renderItem = ({ item }: { item: Course }) => {
    const isTeacher = item.teacherId === user?.uuid;

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/course-detail', params: { course: JSON.stringify(item) } })}
        style={[styles.courseCard, {
          backgroundColor: theme.surface,
          borderColor: isTeacher ? theme.success : theme.primary,
        }]}
      >
        <View style={styles.cardHeader}>
          <Ionicons
            name={isTeacher ? 'school-outline' : 'person-outline'}
            size={20}
            color={isTeacher ? theme.success : theme.primary}
          />
          <Text style={[styles.courseTitle, { color: theme.text }]}> 
            {item.title}
          </Text>
        </View>
        <Text
          numberOfLines={3}
          style={[styles.courseDescription, { color: theme.text }]}
        >
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>My Courses</Text>

      <FlatList
        data={courses}
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
  list: {
    paddingBottom: 100,
  },
  courseCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 140,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
    fontFamily: 'SpaceMono',
  },
  courseDescription: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'SpaceMono',
    lineHeight: 20,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
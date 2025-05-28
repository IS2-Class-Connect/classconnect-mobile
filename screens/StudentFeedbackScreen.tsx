import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAllCourses, getCourseEnrollments, Enrollment, Course } from '../services/coursesApi';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { useRouter } from 'expo-router';

export default function StudentFeedbackScreen() {
  const theme = useTheme();
  const { user, authToken } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken || !user) return;
      
      try {
        // Obtener todos los cursos del usuario
        const allCourses = await getAllCourses(authToken);
        setCourses(allCourses);

        const userEnrollments: Enrollment[] = [];

        // Obtener las inscripciones de cada curso
        for (const course of allCourses) {
          const enrollmentsForCourse = await getCourseEnrollments(course.id, authToken);
          // Filtrar las inscripciones correspondientes al usuario
          const userEnrollment = enrollmentsForCourse.find(
            (e) => e.userId === user.uuid && e.role === 'STUDENT'
          );
          if (userEnrollment) {
            userEnrollments.push(userEnrollment);
          }
        }

        setEnrollments(userEnrollments);

        // Calcular el promedio de estrellas
        const totalRating = userEnrollments.reduce(
          (sum, enrollment) => sum + (enrollment.student_note || 0),
          0
        );
        const avgRating = totalRating / userEnrollments.length;
        setAverageRating(avgRating);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authToken]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={24}
          color={theme.warning}
          style={{ marginHorizontal: 2 }}
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const renderFeedback = ({ item }: { item: Enrollment }) => {
    const course = courses.find(c => c.id === item.courseId); // Obtener el curso por el ID
    return (
      <View style={styles.feedbackRow}>
        <Text style={[styles.courseName, { color: theme.text }]}>
          Course: {course ? course.title : 'Course not found'}
        </Text>
        <View style={styles.starsContainer}>{renderStars(item.student_note || 0)}</View>
        <Text style={[styles.feedbackText, { color: theme.text }]}>
          {item.student_feedback || 'No feedback provided'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Flecha para volver hacia atrás */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={30} color={theme.primary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>My Feedbacks</Text>

      {/* Show average rating only if there are feedbacks */}
      {enrollments.length > 0 && (
        <Text style={[styles.averageRating, { color: theme.text }]}>
          Average Rating: {averageRating.toFixed(1)} / 5
        </Text>
      )}

      <FlatList
        data={enrollments}
        keyExtractor={(item) => item.courseId.toString()}
        renderItem={renderFeedback}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={{ color: theme.text, textAlign: 'center', marginTop: spacing.md }}>
            No feedbacks yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Center the content vertically
    padding: spacing.lg,
    marginTop: '10%', // Add some space from the top to center the content more down
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  averageRating: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  feedbackRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: spacing.md,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
  },
  feedbackText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  list: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    alignItems: 'flex-start', // Adjust back button position to left
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getAllCourses,
  getCourseEnrollments,
  Enrollment,
  Course,
  getMockStudentFeedbackSummary,
} from '../services/coursesApi';
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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken || !user) return;

      try {
        const allCourses = await getAllCourses(authToken);
        setCourses(allCourses);

        const userEnrollments: Enrollment[] = [];

        for (const course of allCourses) {
          const enrollmentsForCourse = await getCourseEnrollments(course.id, authToken);
          const userEnrollment = enrollmentsForCourse.find(
            (e) => e.userId === user.uuid && e.role === 'STUDENT'
          );
          if (userEnrollment) userEnrollments.push(userEnrollment);
        }

        setEnrollments(userEnrollments);

        const totalRating = userEnrollments.reduce(
          (sum, enrollment) => sum + (enrollment.student_note || 0),
          0
        );
        const avgRating = totalRating / userEnrollments.length;
        setAverageRating(avgRating);

        const summary = getMockStudentFeedbackSummary();
        setAiSummary(summary);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authToken]);

  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < rating ? 'star' : 'star-outline'}
            size={24}
            color={theme.warning}
            style={{ marginHorizontal: 2 }}
          />
        ))}
      </View>
    );
  };

  const renderFeedback = ({ item }: { item: Enrollment }) => {
    const course = courses.find((c) => c.id === item.courseId);
    return (
      <View style={[styles.feedbackRow, { backgroundColor: theme.surface }]}>
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
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={30} color={theme.primary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>My Feedbacks</Text>

      {enrollments.length > 0 && (
        <Text style={[styles.averageRating, { color: theme.text }]}>
          Average Rating: {averageRating.toFixed(1)} / 5
        </Text>
      )}

      {aiSummary && (
        <View style={[styles.classyOpinionContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.classyHeaderRow}>
            <Image
              source={require('../assets/icons/classy-logo.png')}
              style={styles.classyImage}
            />
            <Text style={[styles.classyOpinionTitle, { color: theme.text }]}>
              Classy's Opinion
            </Text>
            <View style={styles.poweredByRow}>
              <Text style={[styles.poweredByText, { color: theme.text }]}>powered by</Text>
              <Image
                source={require('../assets/icons/gemini-logo.png')}
                style={styles.geminiImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={[styles.classyOpinionText, { color: theme.text }]}>{aiSummary}</Text>
        </View>
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
    justifyContent: 'center',
    padding: spacing.lg,
    marginTop: '10%',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: fonts.weight.bold as '700',
    marginBottom: spacing.md,
  },
  averageRating: {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.medium as '500',
    marginBottom: spacing.md,
  },
  feedbackRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  courseName: {
    fontSize: fonts.size.md,
    fontWeight: fonts.weight.medium as '500',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
  },
  feedbackText: {
    fontSize: fonts.size.sm,
    fontStyle: 'italic',
  },
  list: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  classyOpinionContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  classyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  classyOpinionTitle: {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold as '700',
  },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  poweredByText: {
    fontSize: fonts.size.xs,
    marginRight: spacing.xs,
  },
  classyOpinionText: {
    fontSize: fonts.size.md,
    marginTop: spacing.sm,
  },
  classyImage: {
    width: 50,
    height: 50,
  },
  geminiImage: {
    width: 24,
    height: 24,
  },
});

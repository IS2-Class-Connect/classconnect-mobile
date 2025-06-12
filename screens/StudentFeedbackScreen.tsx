import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getAllCourses,
  getAllStudentFeedbacks,
  Course,
} from '../services/coursesApi';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { useRouter } from 'expo-router';

interface StudentFeedback {
  courseId: number;
  studentNote: number;
  studentFeedback: string;
}

export default function StudentFeedbackScreen() {
  const theme = useTheme();
  const { user, authToken } = useAuth();
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken || !user?.uuid) {
        console.warn('⛔ No auth token or user UUID');
        return;
      }

      try {
        const [allCourses, feedbackResponse] = await Promise.all([
          getAllCourses(authToken),
          getAllStudentFeedbacks(user.uuid, authToken),
        ]);

        setCourses(allCourses);
        setFeedbacks(feedbackResponse.feedbacks);
        setAiSummary(feedbackResponse.summary);

        const totalRating = feedbackResponse.feedbacks.reduce(
          (sum, item) => sum + (item.studentNote || 0),
          0
        );
        const avgRating =
          feedbackResponse.feedbacks.length > 0
            ? totalRating / feedbackResponse.feedbacks.length
            : 0;
        setAverageRating(avgRating);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uuid, authToken]);

  const renderStars = (rating: number) => (
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

  const filteredFeedbacks = feedbacks.filter((item) => {
    const course = courses.find((c) => c.id === item.courseId);
    const courseTitle = course?.title.toLowerCase() || '';
    const feedbackText = item.studentFeedback.toLowerCase();
    return (
      courseTitle.includes(search.toLowerCase()) ||
      feedbackText.includes(search.toLowerCase())
    );
  });

  const renderFeedback = ({ item }: { item: StudentFeedback }) => {
    const course = courses.find((c) => c.id === item.courseId);
    return (
      <View style={[styles.feedbackRow, { backgroundColor: theme.surface }]}>
        <Text style={[styles.courseName, { color: theme.text }]}>
          Course: {course ? course.title : 'Course not found'}
        </Text>
        <View style={styles.starsContainer}>{renderStars(item.studentNote || 0)}</View>
        <Text style={[styles.feedbackText, { color: theme.text }]}>  
          {item.studentFeedback || 'No feedback provided'}
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
      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/profile')}>
        <Ionicons name="arrow-back" size={30} color={theme.primary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>My Feedbacks</Text>

      {feedbacks.length > 0 && (
        <Text style={[styles.averageRating, { color: theme.text }]}>Average Rating: {averageRating.toFixed(1)} / 5</Text>
      )}

      {aiSummary && (
        <View style={[styles.classyOpinionContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.classyHeaderRow}>
            <Image source={require('../assets/icons/classy-logo.png')} style={styles.classyImage} />
            <Text style={[styles.classyOpinionTitle, { color: theme.text }]}>Classy's Opinion</Text>
            <View style={styles.poweredByRow}>
              <Text style={[styles.poweredByText, { color: theme.text }]}>powered by</Text>
              <Image source={require('../assets/icons/gemini-logo.png')} style={styles.geminiImage} resizeMode="contain" />
            </View>
          </View>
          <Text style={[styles.classyOpinionText, { color: theme.text }]}>{aiSummary}</Text>
        </View>
      )}

      <TextInput
        style={[styles.searchInput, { color: theme.text, borderColor: theme.primary }]}
        placeholder="Search in course or feedback..."
        placeholderTextColor={"#888"}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredFeedbacks}
        keyExtractor={(item, index) => `${item.courseId}-${index}`}
        renderItem={renderFeedback}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ color: theme.text, textAlign: 'center', marginTop: spacing.md }}>No feedbacks match your search.</Text>}
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
    width: '100%',
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    flexShrink: 1,
  },
  courseName: {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold as '700',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    flexWrap: 'nowrap',
  },
  feedbackText: {
    fontSize: fonts.size.md,
    fontStyle: 'italic',
    lineHeight: 20,
    flexWrap: 'wrap',
    flexShrink: 1,
    flexGrow: 1,
    width: '100%',
  },
  list: {
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
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
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
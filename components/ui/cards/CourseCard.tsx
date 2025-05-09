import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course, getCourseEnrollments, Enrollment } from '../../../services/coursesApi';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';

interface CourseCardProps {
  course: Course;
  isTeacher: boolean;
  isEnrolled: boolean;
}

export default function CourseCard({ course, isTeacher, isEnrolled }: CourseCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isFull, setIsFull] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const fetchEnrollments = async () => {
    if (!authToken) return;
    try {
      const result = await getCourseEnrollments(course.id, authToken);
      setEnrollments(result);
      setIsFull(result.length >= course.totalPlaces);

      const now = new Date();
      const deadlinePassed = new Date(course.registrationDeadline) < now;
      setIsClosed(deadlinePassed || result.length >= course.totalPlaces);
    } catch (e) {
      console.error('❌ Error fetching enrollments:', e);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [authToken]);

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/course-detail', params: { course: JSON.stringify(course) } })}
      style={[styles.card, {
        backgroundColor: theme.surface,
        borderColor: isClosed ? theme.error : isTeacher ? theme.success : isEnrolled ? theme.primary : theme.success,
      }]}
    >
      <View style={styles.header}>
        <Ionicons
          name={isTeacher ? 'school-outline' : isEnrolled ? 'person-outline' : 'checkmark-done-outline'}
          size={20}
          color={isTeacher ? theme.success : isEnrolled ? theme.primary : theme.success}
        />
        <Text style={[styles.title, { color: theme.text }]}> {course.title}</Text>
        {isClosed && (
          <Ionicons name="lock-closed-outline" size={18} color={theme.error} style={{ marginLeft: 6 }} />
        )}
      </View>

      <Text numberOfLines={3} style={[styles.description, { color: theme.text }]}> {course.description}</Text>

      <Text style={[styles.info, { color: theme.text }]}> {enrollments.length} / {course.totalPlaces} enrolled</Text>

      {isEnrolled && (
        <Text style={[styles.enrolled, { color: theme.success }]}>✔ You're enrolled</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 160,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
    fontFamily: fonts.family.regular,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.family.regular,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  info: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  enrolled: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
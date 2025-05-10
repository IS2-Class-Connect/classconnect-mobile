import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../../services/coursesApi';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useRouter } from 'expo-router';

interface CourseCardProps {
  course: Course;
  isTeacher: boolean;
  isEnrolled: boolean;
  isFull: boolean;
  isClosed: boolean;
}

export default function CourseCard({ course, isTeacher, isEnrolled, isFull, isClosed }: CourseCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const shouldShowRed = isClosed && !isEnrolled && !isTeacher;

  const borderColor = shouldShowRed
    ? theme.error
    : isTeacher || isEnrolled
    ? theme.primary
    : theme.success;

  const iconName = isTeacher
    ? 'school-outline'
    : isEnrolled
    ? 'person-outline'
    : isFull
    ? 'lock-closed-outline'
    : 'checkmark-done-outline';

  const iconColor = shouldShowRed
    ? theme.error
    : isTeacher || isEnrolled
    ? theme.primary
    : theme.success;

  const cardMessage = isFull && !isEnrolled
    ? 'FULLY BOOKED'
    : isEnrolled
    ? ", You're enrolled"
    : '';

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/course-detail', params: { course: JSON.stringify(course) } })}
      style={[styles.card, {
        backgroundColor: theme.surface,
        borderColor: borderColor,
      }]}
    >
      <View style={styles.header}>
        <Ionicons name={iconName} size={20} color={iconColor} />
        <Text style={[styles.title, { color: theme.text }]}> {course.title}</Text>
        {shouldShowRed && (
          <Ionicons name="lock-closed-outline" size={18} color={theme.error} style={{ marginLeft: 6 }} />
        )}
      </View>

      <Text numberOfLines={3} style={[styles.description, { color: theme.text }]}> {course.description}</Text>

      <Text style={[styles.info, { color: theme.text }]}> {course.totalPlaces} places total{cardMessage}</Text>
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
});

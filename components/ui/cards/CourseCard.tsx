import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../../services/coursesApi';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useRouter } from 'expo-router';
import { Enrollment } from '../../../services/coursesApi';

interface CourseCardProps {
  course: Course;
   enrollments: Enrollment[];
  isTeacher: boolean;
  isEnrolled: boolean;
  isAssistant: boolean;
  isFull: boolean;
  isClosed: boolean;
}

export default function CourseCard({
  course,
  enrollments,
  isTeacher,
  isEnrolled,
  isAssistant,
  isFull,
  isClosed,
}: CourseCardProps) {
  const theme = useTheme();
  const router = useRouter();

  // Filter enrollments to only count students (excluding assistants and professors)
  const studentsOnly = enrollments.filter((e) => e.role === 'STUDENT');
  console.log('Students Only:', studentsOnly);
  const enrolledCount = studentsOnly.length;

  const role = isTeacher
    ? 'Professor'
    : isAssistant
    ? 'Assistant'
    : isEnrolled
    ? 'Student'
    : null;

  const remaining = course.totalPlaces - enrolledCount;
  const remainingPercentage = remaining / course.totalPlaces;
  const isLowAvailability = !isFull && !isClosed && (remainingPercentage <= 0.1 || remaining <= 5);

  const iconColor = isTeacher || isAssistant || isEnrolled
    ? theme.primary
    : isClosed || isFull
    ? theme.error
    : isLowAvailability
    ? theme.warning
    : theme.success;

  const borderColor = isTeacher || isAssistant || isEnrolled
    ? theme.primary
    : isClosed || isFull
    ? theme.error
    : isLowAvailability
    ? theme.warning
    : theme.success;

  const statusLabel = isFull
    ? 'FULL'
    : isClosed
    ? 'Registration closed'
    : isLowAvailability
    ? 'Few spots left'
    : null;

  const iconName = isTeacher
    ? 'school-outline'
    : isAssistant
    ? 'person-add-outline'
    : isEnrolled
    ? 'school'
    : isClosed || isFull
    ? 'lock-closed-outline'
    : isLowAvailability
    ? 'alert-circle-outline'
    : null;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/course-detail', params: { course: JSON.stringify(course) } })
      }
      style={[styles.card, { backgroundColor: theme.surface, borderColor }]}
    >
      {role && iconName && (
        <View style={[styles.roleBadge, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName} size={14} color={iconColor} />
          <Text style={[styles.roleText, { color: iconColor }]}>{role}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{course.title}</Text>
      </View>

      <View style={styles.divider} />

      <Text numberOfLines={3} style={[styles.description, { color: theme.text }]}>
        {course.description}
      </Text>

      <Text style={[styles.info, { color: theme.text }]}> 
        {enrolledCount}/{course.totalPlaces} places
        {statusLabel ? (
          <Text style={{ color: isLowAvailability ? theme.warning : theme.error }}> – {statusLabel}</Text>
        ) : null}
      </Text>
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.family.regular,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: spacing.sm,
    opacity: 0.4,
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
  roleBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  roleText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

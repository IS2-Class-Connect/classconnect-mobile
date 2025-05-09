import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { Course } from '../services/coursesApi';
import { useAuth } from '../context/AuthContext';
import CourseForm from '../components/ui/forms/CoursesForm';
import Button from '../components/ui/buttons/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function CourseDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { course } = useLocalSearchParams<{ course: string }>();

  if (typeof course !== 'string') {
    return (
      <SafeAreaView style={[styles.full, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: 'center' }}>⚠️ Invalid course data</Text>
        <Button title="Back" onPress={() => router.navigate('/(tabs)/courses')} variant="secondary" />
      </SafeAreaView>
    );
  }

  let parsedCourse: Course;
  try {
    parsedCourse = JSON.parse(course);
  } catch (e) {
    return (
      <SafeAreaView style={[styles.full, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: 'center' }}>⚠️ Error parsing course data</Text>
        <Button title="Back" onPress={() => router.navigate('/(tabs)/courses')} variant="secondary" />
      </SafeAreaView>
    );
  }

  const isTeacher = parsedCourse.teacherId === user?.uuid;
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUpdate = async (updated: Omit<Course, 'id' | 'createdAt'>) => {
    console.log('Update:', updated);
    setEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    console.log('Course deleted');
    router.navigate('/(tabs)/courses');
  };

  return (
    <SafeAreaView style={[styles.full, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/courses')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Animated.Text
          entering={FadeInUp.duration(400)}
          style={[styles.headerTitle, { color: theme.text }]}
        >
          {parsedCourse.title}
        </Animated.Text>

        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
          {editing ? (
            <CourseForm
              initialValues={parsedCourse}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
              submitLabel="Save Changes"
            />
          ) : (
            <View
              style={[
                styles.courseCard,
                {
                  backgroundColor: theme.card,
                  borderColor: isTeacher ? theme.success : theme.primary,
                },
              ]}
            >
              <Text style={[styles.description, { color: theme.text }]}>
                {parsedCourse.description}
              </Text>

              <View style={styles.metaGroup}>
                <Ionicons name="calendar-outline" size={16} color={theme.text} />
                <Text style={[styles.meta, { color: theme.text }]}>
                  Start: {new Date(parsedCourse.startDate).toDateString()}
                </Text>
              </View>
              <View style={styles.metaGroup}>
                <Ionicons name="alarm-outline" size={16} color={theme.text} />
                <Text style={[styles.meta, { color: theme.text }]}>
                  Deadline: {new Date(parsedCourse.registrationDeadline).toDateString()}
                </Text>
              </View>
              <View style={styles.metaGroup}>
                <Ionicons name="calendar-outline" size={16} color={theme.text} />
                <Text style={[styles.meta, { color: theme.text }]}>
                  End: {new Date(parsedCourse.endDate).toDateString()}
                </Text>
              </View>
              <View style={styles.metaGroup}>
                <Ionicons name="people-outline" size={16} color={theme.text} />
                <Text style={[styles.meta, { color: theme.text }]}>
                  {parsedCourse.totalPlaces} places
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttons}>
          {isTeacher ? (
            !editing && (
              <>
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Ionicons name="create-outline" size={28} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
                  <Ionicons name="trash-outline" size={28} color={theme.error} />
                </TouchableOpacity>
              </>
            )
          ) : (
            <TouchableOpacity style={[styles.enrollBtn, { backgroundColor: theme.buttonPrimary }]}>
              <Text style={styles.enrollText}>Enroll</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalText, { color: theme.text }]}>
              Are you sure you want to delete this course?
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowDeleteModal(false)} variant="secondary" />
              <Button title="Delete" onPress={handleDelete} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.size.xxl,
    fontWeight: '700',
    fontFamily: fonts.family.regular,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  courseCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 300,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  description: {
    fontSize: fonts.size.md,
    fontFamily: fonts.family.regular,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  meta: {
    fontSize: fonts.size.sm,
    fontFamily: fonts.family.regular,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  enrollBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  enrollText: {
    color: 'white',
    fontSize: fonts.size.md,
    fontWeight: '500',
    fontFamily: fonts.family.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    padding: spacing.lg,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
  },
  modalText: {
    fontSize: fonts.size.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
});

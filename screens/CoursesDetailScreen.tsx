import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
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

export default function CourseDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { course } = useLocalSearchParams<{ course: string }>();

  if (typeof course !== 'string') {
    return (
      <View style={[styles.full, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>⚠️ Invalid course data</Text>
        <Button title="Back" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  let parsedCourse: Course;
  try {
    parsedCourse = JSON.parse(course);
  } catch (e) {
    return (
      <View style={[styles.full, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>⚠️ Error parsing course data</Text>
        <Button title="Back" onPress={() => router.back()} variant="secondary" />
      </View>
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
    router.back();
  };

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={router.back} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: theme.text }]}>{parsedCourse.title}</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {editing ? (
          <CourseForm
            initialValues={parsedCourse}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitLabel="Save Changes"
          />
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.description, { color: theme.text }]}>{parsedCourse.description}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.text} />
              <Text style={[styles.meta, { color: theme.text }]}>Start date: {new Date(parsedCourse.startDate).toDateString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="alarm-outline" size={16} color={theme.text} />
              <Text style={[styles.meta, { color: theme.text }]}>Registration deadline: {new Date(parsedCourse.registrationDeadline).toDateString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.text} />
              <Text style={[styles.meta, { color: theme.text }]}>End date: {new Date(parsedCourse.endDate).toDateString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={16} color={theme.text} />
              <Text style={[styles.meta, { color: theme.text }]}>{parsedCourse.totalPlaces} total places</Text>
            </View>
          </View>
        )}

        <View style={styles.buttons}>
          {isTeacher ? (
            <>
              {!editing && (
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Ionicons name="create-outline" size={32} color="#339CFF" />
                </TouchableOpacity>
              )}
              {!editing && (
                <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
                  <Ionicons name="trash-outline" size={32} color="red" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity onPress={() => console.log('Enroll')}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#339CFF" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalText, { color: theme.text }]}>Are you sure you want to delete this course?</Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowDeleteModal(false)} variant="secondary" />
              <Button title="Delete" onPress={handleDelete} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    paddingTop: spacing.xl + 10,
  },
  backButton: {
    marginLeft: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 16,
    gap: spacing.md,
    elevation: 2,
  },
  description: {
    fontSize: fonts.size.md,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  meta: {
    fontSize: fonts.size.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    marginTop: spacing.lg,
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
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
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
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getCourseActivities, CourseActivity } from '../services/coursesApi';
import { getAllUsers, User } from '../services/userApi';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';

export default function ActivityRegisterScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { authToken } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken || !courseId) return;
      try {
        const [activityRes, userRes] = await Promise.all([
          getCourseActivities(Number(courseId), authToken),
          getAllUsers(authToken),
        ]);
        setActivities(activityRes);
        setUsers(userRes);
      } catch (e) {
        console.error('Error loading activity data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authToken, courseId]);

  const getUser = (userId: string) => users.find((u) => u.uuid === userId);

  const formatActivityText = (type: string): string => {
    switch (type) {
      case 'EDIT_COURSE': return 'edited the course';
      case 'ADD_MODULE': return 'added a module';
      case 'DELETE_MODULE': return 'deleted a module';
      case 'ADD_EXAM': return 'created an exam';
      case 'EDIT_EXAM': return 'edited an exam';
      case 'DELETE_EXAM': return 'deleted an exam';
      case 'GRADE_EXAM': return 'graded an exam';
      case 'ADD_TASK': return 'added a task';
      case 'EDIT_TASK': return 'edited a task';
      case 'DELETE_TASK': return 'deleted a task';
      case 'GRADE_TASK': return 'graded a task';
      default: return 'performed an action';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.primary }]}>Assistant Activity Log</Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const user = getUser(item.user_id);
            return (
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.userRow}>
                  <Image
                    source={{ uri: user?.urlProfilePhoto || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={[styles.userName, { color: theme.text }]}>{user?.name || item.user_id}</Text>
                    <Text style={[styles.meta, { color: theme.text }]}> {formatActivityText(item.activity)}</Text>
                    <Text style={[styles.meta, { color: theme.text }]}> {new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.text }]}>No activity yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  card: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: fonts.size.md,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: fonts.size.sm,
    opacity: 0.8,
  },
  empty: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

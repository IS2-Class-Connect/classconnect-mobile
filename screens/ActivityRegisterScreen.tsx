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

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png';

export default function ActivityRegisterScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { authToken, user } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Track failed images
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching activities for course:', courseId);
      if (!authToken || !courseId || !user?.uuid) {
        setLoading(false);
        return;
      }
      try {
        const [activityRes, userRes] = await Promise.all([
          getCourseActivities(Number(courseId), authToken, user.uuid),
          getAllUsers(authToken),
        ]);
        console.log('Fetched activities:', activityRes);
        setActivities(activityRes);
        setUsers(userRes);
      } catch {
        setActivities([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authToken, courseId, user?.uuid]);

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

  const onImageError = (userId: string) => {
    setFailedImages((prev) => ({ ...prev, [userId]: true }));
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, justifyContent: 'center', paddingTop: spacing.xl * 2 },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.primary, textAlign: 'center', marginBottom: spacing.xl }]}>
        Assistant Activity Log
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl * 2, flexGrow: 1 }]}
          renderItem={({ item }) => {
            const userItem = getUser(item.userId);
            const userId = userItem?.uuid || item.userId;
            const imgUri = userItem?.urlProfilePhoto;

            return (
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.userRow}>
                  <Image
                    source={
                      failedImages[userId]
                        ? { uri: DEFAULT_AVATAR }
                        : imgUri
                          ? { uri: imgUri }
                          : { uri: DEFAULT_AVATAR }
                    }
                    style={styles.avatar}
                    onError={() => onImageError(userId)}
                  />
                  <View>
                    <Text style={[styles.userName, { color: theme.text }]}>
                      {userItem?.name || userId}
                    </Text>
                    <Text style={[styles.meta, { color: theme.text }]}>
                      {formatActivityText(item.activity)}
                    </Text>
                    <Text style={[styles.meta, { color: theme.text }]}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.text }]}>No activity yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 0,
  },
  card: {
    padding: spacing.md,
    borderRadius: 10,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#999',
  },
  userName: {
    fontSize: fonts.size.md,
    fontWeight: '700',
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

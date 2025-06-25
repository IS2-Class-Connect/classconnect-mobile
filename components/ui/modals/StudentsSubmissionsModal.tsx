import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Submission } from '../../../services/assessmentsApi';
import { User, findUserByUuid } from '../../../services/userApi';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { UserCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type Props = {
  visible: boolean;
  onClose: () => void;
  submissions: Submission[];
  assessmentType: 'Exam' | 'Task';
  onSelect: (submission: Submission) => void;
};

export default function StudentsSubmissionsModal({
  visible,
  onClose,
  submissions,
  assessmentType,
  onSelect,
}: Props) {
  const theme = useTheme();
  const { authToken } = useAuth();
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!authToken || submissions.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const userMap: Record<string, User> = {};
      const uncachedUserIds = submissions
        .map((s) => s.userId)
        .filter((id) => !users[id]);

      for (const userId of uncachedUserIds) {
        try {
          const user = await findUserByUuid(userId, authToken);
          userMap[userId] = user;
        } catch (error) {
          //console.error('❌ Error fetching user', userId, error);
        }
      }
      setUsers((prev) => ({ ...prev, ...userMap }));
      setLoading(false);
    };

    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  const handleNavigateToCorrection = (submission: Submission) => {
    const correction = {
      corrections: submission.answers.map((a) => a.correction),
      note: submission.note ?? 0,
      feedback: submission.feedback ?? '',
      aiSummary: submission.AIFeedback ?? '',
    };

    onClose();
    router.push({
      pathname: '/exercises-correction',
      params: {
        assessmentId: submission.assesId,
        userId: submission.userId,
        correction: JSON.stringify(correction),
      },
    });
  };

  const renderItem = ({ item }: { item: Submission }) => {
    const user = users[item.userId];
    if (!user) return null;

    const date = new Date(item.submittedAt).toLocaleString();
    const wasCorrected = !!item.correctedAt;

    return (
      <View style={[styles.item, { backgroundColor: theme.card }]}>
        <View style={styles.avatar}>
          {user.urlProfilePhoto ? (
            <Image
              source={{ uri: user.urlProfilePhoto }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />
          ) : (
            <UserCircle2 size={48} color={theme.text} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.date, { color: theme.text + '99' }]}>
            Submitted: {date}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.primary }]}
          onPress={() => handleNavigateToCorrection(item)}
        >
          <Text style={[styles.buttonText, { color: theme.primary }]}>
            {wasCorrected ? '✏️ Edit Correction' : `📝 Correct ${assessmentType}`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.dark ? '#000000DD' : '#00000066' },
        ]}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Submissions for {assessmentType}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : submissions.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.text + '99' }}>
              No submissions yet.
            </Text>
          ) : (
            <FlatList
              data={[...submissions].sort(
                (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
              )}
              keyExtractor={(item) => item.userId}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: spacing.md }}
            />
          )}

          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { borderColor: theme.primary }]}
          >
            <Text style={[styles.closeText, { color: theme.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  container: {
    borderRadius: 12,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
    overflow: 'hidden',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fonts.size.md,
    fontWeight: '600',
  },
  date: {
    fontSize: fonts.size.sm,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  buttonText: {
    fontWeight: '600',
  },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  closeText: {
    fontSize: fonts.size.md,
    fontWeight: 'bold',
  },
});

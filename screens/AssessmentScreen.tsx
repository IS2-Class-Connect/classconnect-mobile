import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import {
  getAssessmentsByCourse,
  Assessment,
} from '../services/assessmentsMockApi';
import AssessmentForm from '../components/ui/forms/AssessmentForm';
import Button from '../components/ui/buttons/Button';

export default function AssessmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken, user } = useAuth();

  const { courseId, role } = useLocalSearchParams<{
    courseId: string;
    role?: 'Student' | 'Professor' | 'Assistant';
  }>();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedTab, setSelectedTab] = useState<'exam' | 'assignment'>('exam');
  const [formVisible, setFormVisible] = useState(false);

  const isTeacherOrAssistant = role === 'Professor' || role === 'Assistant';

  const fetchAssessments = async () => {
    if (!authToken || !courseId) return;
    try {
      const data = await getAssessmentsByCourse(Number(courseId));
      setAssessments(data);
    } catch (e) {
      console.error('Error loading assessments:', e);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [courseId]);

  const filtered = assessments.filter((a) => a.type === selectedTab);

  if (!authToken || !user || !courseId) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.title, { color: theme.primary }]}>Assessments</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['exam', 'assignment'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedTab(type as 'exam' | 'assignment')}
              style={[
                styles.tabButton,
                {
                  borderBottomColor:
                    selectedTab === type ? theme.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === type ? theme.primary : theme.text },
                ]}
              >
                {type === 'exam' ? 'Exams' : 'Tasks'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List of assessments */}
        <View style={styles.list}>
          {filtered.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No {selectedTab}s found.
            </Text>
          )}

          {filtered.map((a) => (
            <View key={a.id} style={[styles.itemCard, { borderColor: theme.primary }]}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>{a.title}</Text>
              <Text style={{ color: theme.text, fontSize: fonts.size.sm }}>
                Due: {new Date(a.deadline).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Create Button */}
      {isTeacherOrAssistant && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.primary }]}
          onPress={() => setFormVisible(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Overlay Form Modal */}
      {formVisible && (
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <AssessmentForm
              courseId={Number(courseId)}
              onClose={async () => {
                setFormVisible(false);
                await fetchAssessments();
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tabButton: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    marginHorizontal: spacing.md,
  },
  tabText: {
    fontSize: fonts.size.md,
    fontWeight: '600',
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  itemTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

// AssessmentScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Alert, Modal, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/fonts';
import { spacing } from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import {
  getAssessmentsByCourse,
  deleteAssessment,
  Assessment,
  AssessmentFilterDto,
} from '../services/assessmentsApi';
import AssessmentForm from '../components/ui/forms/AssessmentForm';

const PAGE_SIZE = 10;

export default function AssessmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken, user } = useAuth();
  const { courseId, role } = useLocalSearchParams<{ courseId: string; role?: 'Student' | 'Professor' | 'Assistant' }>();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedTab, setSelectedTab] = useState<'Exam' | 'Task'>('Exam');
  const [formVisible, setFormVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AssessmentFilterDto>({ type: 'Exam' });
  const [tempFilters, setTempFilters] = useState<AssessmentFilterDto>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isProfessor = role === 'Professor';
  const isAssistant = role === 'Assistant';

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      type: selectedTab,
    }));
    setPage(1);
  }, [selectedTab]);

  const fetchAssessments = async () => {
    if (!authToken || !courseId) return;
    try {
      const res = await getAssessmentsByCourse(
        Number(courseId),
        page,
        filters,
        authToken
      );
      console.log('Fetched assessments:', res);
      setAssessments(res.assessments);
      setTotal(res.total);
    } catch (e) {
      console.error('Error loading assessments:', e);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [filters, page]);

  const getStatus = (a: Assessment): 'UPCOMING' | 'OPEN' | 'CLOSED' => {
    const now = new Date();
    const start = new Date(a.startTime);
    const end = new Date(a.deadline);
    if (now < start) return 'UPCOMING';
    if (now >= start && now <= end) return 'OPEN';
    return 'CLOSED';
  };

  const getCardBorderColor = (status: string): string => {
    if (status === 'UPCOMING') return '#007bff';
    if (status === 'OPEN') return '#28a745';
    return '#dc3545';
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filterButtonColor = filters.day ? theme.primary : '#888';

  if (!authToken || !user || !courseId) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.primary }]}>Assessments</Text>

        <View style={styles.tabContainer}>
          {['Exam', 'Task'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedTab(type as 'Exam' | 'Task')}
              style={[
                styles.tabButton,
                { borderBottomColor: selectedTab === type ? theme.primary : 'transparent' }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: selectedTab === type ? theme.primary : theme.text }
              ]}>
                {type === 'Exam' ? 'Exams' : 'Tasks'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => {
            setTempFilters(filters);
            setFilterModalVisible(true);
          }}
          style={[styles.filterButton, { backgroundColor: filterButtonColor }]}
        >
          <Ionicons name="calendar" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 6 }}>Filters</Text>
        </TouchableOpacity>

        {assessments.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.text }]}>No results found.</Text>
        )}

        <View style={styles.list}>
          {assessments.map((a) => {
            const status = getStatus(a);
            return (
              <TouchableOpacity
                key={a.id}
                onPress={() => {
                  router.push({
                    pathname: '/assessment-detail',
                    params: {
                      courseId: String(courseId),
                      assessmentId: a.id.toString(),
                      role: role ?? 'Student',
                    },
                  });
                }}
                style={[styles.itemCard, { borderColor: getCardBorderColor(status) }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{a.title}</Text>
                  <Text style={{ color: theme.text }}>
                    Due: {new Date(a.deadline).toLocaleDateString()}
                  </Text>
                  <Text style={{ color: theme.text, fontStyle: 'italic' }}>
                    Status: {status}
                  </Text>
                </View>
                {(isProfessor || isAssistant) && (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity onPress={() => { setEditingAssessment(a); setFormVisible(true); }}>
                      <Text style={{ fontSize: 18, color: theme.primary }}>✏️</Text>
                    </TouchableOpacity>
                    {isProfessor && (
                      <TouchableOpacity onPress={() => {
                        Alert.alert('Confirm Delete', 'Are you sure?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete', style: 'destructive', onPress: async () => {
                              await deleteAssessment(Number(courseId), a.id, authToken, user.uuid);
                              await fetchAssessments();
                            }
                          }
                        ]);
                      }}>
                        <Text style={{ fontSize: 18, color: theme.primary }}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
              <Text style={{ color: theme.primary }}>Prev</Text>
            </TouchableOpacity>
            <Text style={{ color: theme.text }}>Page {page} / {totalPages}</Text>
            <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
              <Text style={{ color: theme.primary }}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {isProfessor && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setEditingAssessment(null);
            setFormVisible(true);
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        visible={formVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <AssessmentForm
              courseId={Number(courseId)}
              initialData={editingAssessment ?? undefined}
              onClose={async () => {
                setFormVisible(false);
                setEditingAssessment(null);
                await fetchAssessments();
              }}
            />
          </View>
        </View>
      </Modal>


      {/* Modal de filtros */}
      <Modal visible={filterModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, padding: spacing.lg }]}>
            <Text style={[styles.title, { color: theme.primary }]}>Filter by date</Text>

            {tempFilters.day ? (
              <Text style={{ color: theme.text, marginTop: spacing.sm }}>
                Selected day: {new Date(tempFilters.day).toLocaleDateString()}
              </Text>
            ) : (
              <Text style={{ color: theme.text, marginTop: spacing.sm }}>
                No day selected
              </Text>
            )}

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.filterButton, { backgroundColor: theme.primary, marginTop: spacing.md }]}
            >
              <Ionicons name="calendar" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 6 }}>Pick day</Text>
            </TouchableOpacity>

            {tempFilters.day && (
              <TouchableOpacity
                onPress={() => setTempFilters({ ...tempFilters, day: undefined })}
                style={{ marginTop: spacing.md }}
              >
                <Text style={{ color: '#dc3545', fontWeight: '600' }}>Clear selected day</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.md }}>
              <TouchableOpacity
                style={[styles.filterButton, { flex: 1, backgroundColor: theme.primary }]}
                onPress={() => {
                  setFilters({
                    ...tempFilters,
                    type: selectedTab,
                  });
                  setPage(1);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Apply filters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, { flex: 1, backgroundColor: '#888' }]}
                onPress={() => {
                  setFilters({ type: selectedTab });
                  setPage(1);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Clear filters</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              style={{ marginTop: spacing.lg }}
            >
              <Text style={{ color: theme.primary, textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'ios' && showDatePicker && (
            <Modal transparent animationType="fade">
              <View style={styles.overlay}>
                <View style={[styles.centeredDatePicker, { backgroundColor: theme.card }]}>
                  <DateTimePicker
                    value={tempFilters.day ? new Date(tempFilters.day) : new Date()}
                    mode="date"
                    display="inline"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        const dayString = selectedDate.toISOString().split('T')[0];
                        setTempFilters({ ...tempFilters, day: dayString });
                      }
                      setShowDatePicker(false);
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ marginTop: spacing.md }}>
                    <Text style={{ color: theme.primary, textAlign: 'center' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={tempFilters.day ? new Date(tempFilters.day) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (event.type === 'set' && selectedDate) {
                  const dayString = selectedDate.toISOString().split('T')[0];
                  setTempFilters({ ...tempFilters, day: dayString });
                }
              }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  itemCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  centeredDatePicker: {
    borderRadius: 12,
    padding: spacing.md,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

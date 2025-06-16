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
  AssessmentFilter,
} from '../services/assessmentsMockApi';
import AssessmentForm from '../components/ui/forms/AssessmentForm';

const PAGE_SIZE = 10;

export default function AssessmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken, user } = useAuth();
  const { courseId, role } = useLocalSearchParams<{ courseId: string; role?: 'Student' | 'Professor' | 'Assistant' }>();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedTab, setSelectedTab] = useState<'exam' | 'assignment'>('exam');
  const [formVisible, setFormVisible] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AssessmentFilter>({});
  const [tempFilters, setTempFilters] = useState<AssessmentFilter>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

  const isProfessor = role === 'Professor';
  const isAssistant = role === 'Assistant';

  const fetchAssessments = async () => {
    if (!authToken || !courseId) return;
    try {
      const res = await getAssessmentsByCourse(Number(courseId), page, {
        ...filters,
        type: selectedTab,
      });
      setAssessments(res.assessments);
      setTotal(res.total);
    } catch (e) {
      console.error('Error loading assessments:', e);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [courseId, selectedTab, page, filters]);

  const getStatus = (a: Assessment): 'UPCOMING' | 'OPEN' | 'CLOSED' => {
    const now = new Date();
    const start = new Date(a.start_time);
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

  const hasActiveFilters = filters.fromDate || filters.toDate || filters.status;
  const filterButtonColor = hasActiveFilters ? theme.primary : '#888';

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date';

    if (!authToken || !user || !courseId) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.primary }]}>Assessments</Text>

        <View style={styles.tabContainer}>
          {['exam', 'assignment'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => { setSelectedTab(type as any); setPage(1); }}
              style={[
                styles.tabButton,
                { borderBottomColor: selectedTab === type ? theme.primary : 'transparent' }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: selectedTab === type ? theme.primary : theme.text }
              ]}>
                {type === 'exam' ? 'Exams' : 'Tasks'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => { setTempFilters(filters); setFilterModalVisible(true); }}
          style={[styles.filterButton, { backgroundColor: filterButtonColor }]}
        >
          <Ionicons name="filter" size={18} color="#fff" />
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
                  if (status === 'OPEN') {
                    router.push({ pathname: '/assessment-detail', params: { courseId, assessmentId: a.id } });
                  }
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
                              await deleteAssessment(Number(courseId), a.id);
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

      {/* Floating add button */}
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

      {/* Form modal */}
      {formVisible && (
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
      )}

        {/* Filter modal */}
      <Modal visible={filterModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Filter Assessments</Text>

            <View style={styles.filterRow}>
              <Text style={{ color: theme.text }}>From:</Text>
              <TouchableOpacity onPress={() => setShowDatePicker('from')}>
                <Text style={{ color: theme.primary }}>
                  {tempFilters.fromDate ? new Date(tempFilters.fromDate).toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={{ color: theme.text }}>To:</Text>
              <TouchableOpacity onPress={() => setShowDatePicker('to')}>
                <Text style={{ color: theme.primary }}>
                  {tempFilters.toDate ? new Date(tempFilters.toDate).toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={{ color: theme.text }}>Status:</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {['UPCOMING', 'OPEN', 'CLOSED'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() =>
                      setTempFilters((prev) => ({
                        ...prev,
                        status: prev.status === s ? undefined : s as 'upcoming' | 'open' | 'closed',
                      }))
                    }
                    style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: tempFilters.status === s ? theme.primary : '#999',
                      backgroundColor: tempFilters.status === s ? theme.primary : 'transparent',
                    }}
                  >
                    <Text style={{ color: tempFilters.status === s ? '#fff' : theme.text }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterFooter}>
              <TouchableOpacity
                onPress={() => {
                  setFilters({});
                  setTempFilters({});
                  setFilterModalVisible(false);
                }}
              >
                <Text style={{ color: theme.primary }}>Clear Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setFilters(tempFilters);
                  setPage(1);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={{ color: theme.primary }}>Apply Filters</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={
                  tempFilters[showDatePicker === 'from' ? 'fromDate' : 'toDate']
                    ? new Date(tempFilters[showDatePicker === 'from' ? 'fromDate' : 'toDate']!)
                    : new Date()
                }
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(e, selectedDate) => {
                  if (e.type === 'set' && selectedDate) {
                    setTempFilters((prev) => ({
                      ...prev,
                      [showDatePicker]: selectedDate.toISOString(),
                    }));
                  }
                  setShowDatePicker(null);
                }}
              />
            )}
          </View>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  filterModal: {
    width: '85%',
    borderRadius: 12,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  filterRow: {
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});


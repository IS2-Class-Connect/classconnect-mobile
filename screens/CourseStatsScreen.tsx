import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getCoursePerformanceSummary,
  getStudentPerformanceSummary,
  getAssessmentPerformanceSummary,
  AssessmentPerformanceDto,
  CoursePerformanceDto,
  StudentPerformanceInCourseDto,
} from '../services/courseStatsApi';
import { getAllUsers, User } from '../services/userApi';
import { Enrollment, getCourseEnrollments } from '../services/coursesApi';
import { ProgressBar } from 'react-native-paper';
import { spacing } from '../constants/spacing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { generateCourseStatsHtml } from '@/utils/generateCourseStatsHtml';
import { shareHtmlAsPdf } from '@/utils/pdfUtils';
import { FileText } from 'lucide-react-native';

export default function CourseStatsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const numericCourseId = Number(courseId);
  const { authToken } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const [tab, setTab] = useState<'summary' | 'student' | 'assessment'>('summary');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [assessments, setAssessments] = useState<AssessmentPerformanceDto[]>([]);
  const [courseStats, setCourseStats] = useState<CoursePerformanceDto | null>(null);
  const [studentStats, setStudentStats] = useState<StudentPerformanceInCourseDto | null>(null);

  const [from, setFrom] = useState<Date | null>(null);
  const [till, setTill] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showTillPicker, setShowTillPicker] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date>(new Date());
  const [tempTill, setTempTill] = useState<Date>(new Date());
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentPerformanceDto | null>(null);
  const [showAssessmentPicker, setShowAssessmentPicker] = useState(false);


  useEffect(() => {
    if (!authToken) return;
    fetchEnrolledStudents();
    fetchAssessments();
  }, [authToken]);

  useEffect(() => {
    if (tab === 'summary') fetchCourseStats();
  }, [tab, from, till]);

  useEffect(() => {
    if (tab === 'student' && selectedStudent) {
      fetchStudentStats(selectedStudent.uuid);
    }
  }, [tab, selectedStudent]);

  const fetchEnrolledStudents = async () => {
  const enrollments = await getCourseEnrollments(numericCourseId, authToken!);
  const studentEnrollments = enrollments.filter((e) => e.role === 'STUDENT');
  const studentIds = studentEnrollments.map((e) => e.userId);
  const allUsers = await getAllUsers(authToken!);
  const filtered = allUsers.filter((u) => studentIds.includes(u.uuid));
  setUsers(filtered);
};



  const fetchAssessments = async () => {
    const data = await getAssessmentPerformanceSummary(numericCourseId, authToken!);
    setAssessments(data);
  };

  const fetchCourseStats = async () => {
    const stats = await getCoursePerformanceSummary(
      numericCourseId,
      authToken!,
      from?.toISOString(),
      till?.toISOString()
    );
    setCourseStats(stats);
  };

  const fetchStudentStats = async (studentId: string) => {
    const stats = await getStudentPerformanceSummary(numericCourseId, studentId, authToken!);
    setStudentStats(stats);
  };


const handleExportPdf = async () => {
  try {
    const studentsStats = await Promise.all(
      users.map(async (user) => {
        const stats = await getStudentPerformanceSummary(numericCourseId, user.uuid, authToken!);
        return { name: user.name, ...stats };
      })
    );

    if (!courseStats) {
      Alert.alert('Error', 'Course statistics are not available.');
      return;
    }

    const html = await generateCourseStatsHtml(assessments, studentsStats, courseStats, users.map(user => user.name));

    await shareHtmlAsPdf(html);
  } catch (error) {
    //console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Could not generate PDF.');
  }
};


  const renderSummary = () => {
    if (!courseStats) return null;

    const barData = [
      {
        value: courseStats.completionRate * 100,
        label: 'Completion %',
        frontColor: '#36A2EB',
        topLabelComponent: () => (
          <Text style={styles.barLabel}>{(courseStats.completionRate * 100).toFixed(1)}%</Text>
        ),
      },
      {
        value: courseStats.openRate * 100,
        label: 'Open Rate %',
        frontColor: '#FFCE56',
        topLabelComponent: () => (
          <Text style={styles.barLabel}>{(courseStats.openRate * 100).toFixed(1)}%</Text>
        ),
      },
    ];

    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          barWidth={36}
          spacing={60}
          height={220}
          noOfSections={4}
          isAnimated
          xAxisLabelTextStyle={{ color: '#fff', fontSize: 12 }}
          yAxisTextStyle={{ color: '#fff', fontSize: 12 }}
          yAxisLabelSuffix="%"
          hideRules
          hideAxesAndRules
        />
        <Text style={styles.averageLabel}>
          Average Grade: {courseStats.averageGrade.toFixed(1)}
        </Text>
        <View style={{ height: spacing.md * 1.5 }} />
        <Text style={styles.chartLabel}>Total Assessments: {courseStats.totalAssessments}</Text>
        <Text style={styles.chartLabel}>Total Submissions: {courseStats.totalSubmissions}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4287f5" />
        </TouchableOpacity>
        <Text style={styles.title}>Performance</Text>
         {/* Botón con el ícono de archivo */}
          <View style={styles.exportButtonContainer}>
            <TouchableOpacity onPress={handleExportPdf} style={styles.exportButton}>
              <FileText size={24} color="#fff" />
            </TouchableOpacity>
          </View>

      </View>

      <View style={styles.tabRow}>
        {['summary', 'student', 'assessment'].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t as any)}
            style={[styles.tab, tab === t && styles.activeTab]}
          >
            <Text style={styles.tabText}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'summary' && (
        <View style={styles.dateRow}>
          <TouchableOpacity
            onPress={() => {
              setTempFrom(from || new Date());
              setShowFromPicker(true);
            }}
            style={[styles.dateButton, styles.activeTab]}
          >
            <Text style={styles.dateLabel}>From: {from?.toDateString() || 'Select'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setTempTill(till || new Date());
              setShowTillPicker(true);
            }}
            style={[styles.dateButton, styles.activeTab]}
          >
            <Text style={styles.dateLabel}>Till: {till?.toDateString() || 'Select'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {tab === 'student' && (
        <>
          <TouchableOpacity
            style={[styles.dateButton, styles.activeTab, { alignSelf: 'center', marginBottom: spacing.md }]}
            onPress={() => setShowStudentPicker(true)}
          >
            <Text style={styles.dateLabel}>
              {selectedStudent ? selectedStudent.name : 'Seleccionar estudiante...'}
            </Text>
          </TouchableOpacity>

          {studentStats && (
  <View style={styles.chartContainer}>
    <PieChart
      data={[
        {
          value: studentStats.completedAssessments,
          color: theme.primary, // Usando el color azul del tema
          text: `${(
            (studentStats.completedAssessments / studentStats.totalAssessments) * 100
          ).toFixed(0)}%`,
        },
        {
          value: studentStats.totalAssessments - studentStats.completedAssessments,
          color: 'white',
          text: `${(
            ((studentStats.totalAssessments - studentStats.completedAssessments) /
              studentStats.totalAssessments) *
            100
          ).toFixed(0)}%`,
        },
      ]}
      radius={80}
      innerRadius={0}
      showText
      textColor="black"
      textSize={14}
    />
    <View style={{ height: spacing.md }} />
    <Text style={styles.averageLabel}>
      Student Average: {studentStats.averageGrade.toFixed(1)}
    </Text>
    <View style={{ height: spacing.sm }} />
    <Text style={styles.chartLabel}>
      Blue indicates completed tasks, while white represents pending or missing ones.
    </Text>
  </View>
)}


        </>
      )}

      <View style={styles.section}>
        {tab === 'summary' && renderSummary()}
        {tab === 'assessment'  && (
  <>
    <TouchableOpacity
      style={[styles.dateButton, styles.activeTab, { alignSelf: 'center', marginBottom: spacing.md }]}
      onPress={() => setShowAssessmentPicker(true)}
    >
      <Text style={styles.dateLabel}>
        {selectedAssessment ? selectedAssessment.title : 'Select assessment...'}
      </Text>
    </TouchableOpacity>

   {selectedAssessment && (
  <View style={styles.chartContainer}>
    <PieChart
      data={[
        {
          value: selectedAssessment.completionRate * 100,
          color: theme.primary, // Usando el color azul del tema
          text: `${(selectedAssessment.completionRate * 100).toFixed(0)}%`,
        },
        {
          value: (1 - selectedAssessment.completionRate) * 100,
          color: 'white',
          text: `${((1 - selectedAssessment.completionRate) * 100).toFixed(0)}%`,
        },
      ]}
      radius={80}
      innerRadius={0}
      showText
      textColor="black"
      textSize={14}
    />
    <Text style={styles.averageLabel}>
      Assessment Average Grade: {selectedAssessment.averageGrade.toFixed(1)}
    </Text>
    <Text style={styles.chartLabel}>
      The pie chart shows the percentage of completed assessments.
    </Text>
  </View>
)}




    </>
  )}
      </View>

      {/* FROM MODAL */}
      <Modal visible={showFromPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFromPicker(false)}>
          <Pressable style={styles.modalContent}>
            <DateTimePicker
              value={tempFrom}
              mode="date"
              display="spinner"
              onChange={(_, selectedDate) => {
                if (selectedDate) setTempFrom(selectedDate);
              }}
              textColor="#000"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setFrom(null); setShowFromPicker(false); }}>
                <Text style={styles.clearText}>Clean Date</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFrom(tempFrom); setShowFromPicker(false); }}>
                <Text style={styles.confirmText}>Select Date</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* TILL MODAL */}
      <Modal visible={showTillPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowTillPicker(false)}>
          <Pressable style={styles.modalContent}>
            <DateTimePicker
              value={tempTill}
              mode="date"
              display="spinner"
              onChange={(_, selectedDate) => {
                if (selectedDate) setTempTill(selectedDate);
              }}
              textColor="#000"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setTill(null); setShowTillPicker(false); }}>
                <Text style={styles.clearText}>Clean Date</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTill(tempTill); setShowTillPicker(false); }}>
                <Text style={styles.confirmText}>Select Date</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* STUDENT SELECTOR MODAL */}
      <Modal visible={showStudentPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowStudentPicker(false)}>
          <Pressable style={[styles.modalContent, { paddingHorizontal: 0, width: 320 }]}>
            <Text style={{ fontWeight: 'bold', marginBottom: spacing.md }}>Seleccionar estudiante</Text>
            <ScrollView style={{ maxHeight: 300, width: '100%' }}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.uuid}
                  onPress={() => {
                    setSelectedStudent(user);
                    setShowStudentPicker(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.sm,
                    borderBottomColor: '#ddd',
                    borderBottomWidth: 1,
                  }}
                >
                  <Image
                    source={{ uri: user.urlProfilePhoto }}
                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: spacing.sm }}
                  />
                  <Text>{user.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>


      {/* ASSESSMENT SELECTOR MODAL */}
      <Modal visible={showAssessmentPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAssessmentPicker(false)}>
          <Pressable style={[styles.modalContent, { paddingHorizontal: 0, width: 320 }]}>
            <Text style={{ fontWeight: 'bold', marginBottom: spacing.md }}>Select Assessment</Text>
            <ScrollView style={{ maxHeight: 300, width: '100%' }}>
              {assessments.map((assessment, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    console.log('Selected assessment:', assessment);
                    setSelectedAssessment(assessment);
                    setShowAssessmentPicker(false);
                  }}
                  style={{
                    padding: spacing.sm,
                    borderBottomColor: '#ddd',
                    borderBottomWidth: 1,
                  }}
                >
                  <Text style={{ textAlign: 'center' }}>{assessment.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: 120,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4287f5',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  tab: {
    padding: spacing.sm,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  activeTab: {
    backgroundColor: '#89B9FF',
  },
  tabText: {
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.lg,
  },
  chartLabel: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: spacing.md,
    color: '#ccc',
  },
  averageLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: spacing.lg,
  },
  dateButton: {
    padding: spacing.sm,
    borderRadius: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: '#000',
  },
  chartContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  barLabel: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    width: 300,
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
  },
  clearText: {
    color: 'red',
    fontWeight: 'bold',
  },
  confirmText: {
    color: '#4287f5',
    fontWeight: 'bold',
  },
  exportButtonContainer: {
  marginTop: spacing.md,
  marginBottom: spacing.md,
  alignItems: 'center',
},
exportButton: {
  backgroundColor: '#4287f5',
  padding: spacing.sm,
  borderRadius: 6,
},
exportText: {
  color: '#fff',
  fontWeight: 'bold',
}

});

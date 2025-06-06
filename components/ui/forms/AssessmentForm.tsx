import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import ExerciseForm from './ExerciseForm';
import { AssessmentType, AssessmentExercise, createAssessment } from '../../../services/assessmentsMockApi';


type AssessmentFormProps = {
  courseId: number;
  onClose: () => void;
};

export default function AssessmentForm({ courseId, onClose }: AssessmentFormProps) {
  const theme = useTheme();
  const { user, authToken } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AssessmentType>('exam');
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date());
  const [tolerance, setTolerance] = useState('2');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [exercises, setExercises] = useState<Record<string, AssessmentExercise>>({});
  const [showPicker, setShowPicker] = useState<{ field: 'start' | 'deadline' | null; visible: boolean }>({ field: null, visible: false });
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !user?.uuid) {
      setErrorMessage('Title is required and user must be authenticated.');
      setErrorVisible(true);
      return;
    }

    try {
      await createAssessment(
        {
          courseId,
          title,
          description,
          type,
          tolerance_time: parseInt(tolerance),
          start_time: startDate.toISOString(),
          deadline: deadline.toISOString(),
          exercises,
        },
        user.uuid 
      );

      Alert.alert('✅ Assessment created');
      onClose();
    } catch (e) {
      console.error(e);
      setErrorMessage('Something went wrong. Please try again.');
      setErrorVisible(true);
    }
  };

  const renderDateField = (label: string, date: Date, field: 'start' | 'deadline') => (
    <TouchableOpacity style={[styles.dateField, { borderBottomColor: theme.primary }]} onPress={() => setShowPicker({ field, visible: true })}>
      <Text style={[styles.dateText, { color: theme.text }]}>{label}: {date.toDateString()}</Text>
    </TouchableOpacity>
  );

  const handleAddExercise = (exercise: AssessmentExercise) => {
    const key = `exercise_${Object.keys(exercises).length + 1}`;
    setExercises(prev => ({ ...prev, [key]: exercise }));
    setExerciseModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.wrapper, { borderColor: theme.primary, backgroundColor: theme.background }]}>
      <Text style={[styles.formTitle, { color: theme.primary }]}>Create Assessment</Text>

      <View style={styles.typeSelectorContainer}>
        {(['exam', 'assignment'] as AssessmentType[]).map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setType(option)}
            style={[styles.typeButton, {
              backgroundColor: type === option ? theme.primary : theme.card,
              borderColor: theme.primary,
            }]}
          >
            <Text style={[styles.typeButtonText, { color: type === option ? '#fff' : theme.text }]}>
              {option === 'exam' ? 'Exam' : 'Task'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.form}>
        <TextField placeholder="Title" value={title} onChangeText={setTitle} style={[styles.smallInput, { backgroundColor: theme.card }]} />
        <TextField
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={[styles.description, styles.smallInput, { backgroundColor: theme.card }]}
        />
        <TextField
          placeholder="Tolerance (hours)"
          value={tolerance}
          onChangeText={setTolerance}
          keyboardType="numeric"
          style={[styles.smallInput, { backgroundColor: theme.card }]}
        />
        {renderDateField('Start Time', startDate, 'start')}
        {renderDateField('Deadline', deadline, 'deadline')}

        <View style={styles.exerciseHeader}>
          <Text style={[styles.exerciseTitle, { color: theme.text }]}>Exercises</Text>
          <TouchableOpacity onPress={() => setExerciseModalVisible(true)}>
            <Text style={[styles.plusButton, { color: theme.primary }]}>＋</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.exerciseList}>
          {Object.entries(exercises).map(([key, ex]) => (
            <Text key={key} style={{ color: theme.text }}>
              • {ex.enunciate} ({ex.type})
            </Text>
          ))}
        </View>

        <View style={styles.buttons}>
          <Button title="Save Assessment" onPress={handleSubmit} variant="primary" />
          <View style={{ marginTop: spacing.md }}>
            <Button title="Cancel" onPress={onClose} variant="secondary" />
          </View>
        </View>
      </View>

      {showPicker.visible && Platform.OS === 'android' && (
        <DateTimePicker
          value={showPicker.field === 'start' ? startDate : deadline}
          mode="date"
          display="default"
          onChange={(_: any, selectedDate?: Date) => {
            if (selectedDate) {
              showPicker.field === 'start' ? setStartDate(selectedDate) : setDeadline(selectedDate);
            }
            setShowPicker({ field: null, visible: false });
          }}
        />
      )}

      <Dialog visible={errorVisible} message={errorMessage} onClose={() => setErrorVisible(false)} type="error" />

      <Modal visible={exerciseModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCentered, { backgroundColor: theme.card }]}> 
            <ExerciseForm onSubmit={handleAddExercise} onCancel={() => setExerciseModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    margin: spacing.lg,
  },
  form: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  formTitle: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: fonts.size.md,
  },
  buttons: {
    marginTop: spacing.lg,
  },
  exerciseList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  smallInput: {
    minHeight: 40,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  typeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: fonts.size.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalCentered: {
    width: '92%',
    maxHeight: '92%',
    borderRadius: 16,
    padding: spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  exerciseTitle: {
    fontSize: fonts.size.md,
    fontWeight: 'bold',
  },
  plusButton: {
    fontSize: 26,
    fontWeight: 'bold',
  },
});

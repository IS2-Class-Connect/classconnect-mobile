import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
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
import {
  AssessmentType,
  AssessmentExercise,
  createAssessment,
  updateAssessment,
  Assessment,
} from '../../../services/assessmentsMockApi';

type AssessmentFormProps = {
  courseId: number;
  onClose: () => void;
  initialData?: Assessment;
};

export default function AssessmentForm({ courseId, onClose, initialData }: AssessmentFormProps) {
  const theme = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AssessmentType>('exam');
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date());
  const [tolerance, setTolerance] = useState('2');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [exercises, setExercises] = useState<Record<string, AssessmentExercise>>({});
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [editingExerciseKey, setEditingExerciseKey] = useState<string | null>(null);

  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerField, setPickerField] = useState<'start' | 'deadline' | null>(null);
  const [dateBuffer, setDateBuffer] = useState<Date>(new Date());

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setType(initialData.type);
      setTolerance(String(initialData.tolerance_time));
      setStartDate(new Date(initialData.start_time));
      setDeadline(new Date(initialData.deadline));
      setExercises(initialData.exercises || {});
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!title.trim() || !user?.uuid) {
      setErrorMessage('Title is required and user must be authenticated.');
      setErrorVisible(true);
      return;
    }

    try {
      if (initialData) {
        await updateAssessment(courseId, initialData.id, {
          title,
          description,
          type,
          tolerance_time: parseInt(tolerance),
          start_time: startDate.toISOString(),
          deadline: deadline.toISOString(),
          exercises,
        }, user.uuid);
        Alert.alert('✅ Assessment updated');
      } else {
        await createAssessment({
          courseId,
          title,
          description,
          type,
          tolerance_time: parseInt(tolerance),
          start_time: startDate.toISOString(),
          deadline: deadline.toISOString(),
          exercises,
        }, user.uuid);
        Alert.alert('✅ Assessment created');
      }
      onClose();
    } catch (e) {
      console.error(e);
      setErrorMessage('Something went wrong. Please try again.');
      setErrorVisible(true);
    }
  };

  const openPicker = (field: 'start' | 'deadline', initial: Date) => {
    setPickerField(field);
    setDateBuffer(initial);
    setPickerMode('date');
    setShowPickerModal(true);
  };

  const renderDateField = (label: string, date: Date, field: 'start' | 'deadline') => (
    <TouchableOpacity
      style={[styles.dateField, { borderBottomColor: theme.primary }]}
      onPress={() => openPicker(field, date)}
    >
      <Text style={[styles.dateText, { color: theme.text }]}>
        {label}: {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );

  const handleAddExercise = (exercise: AssessmentExercise) => {
    if (editingExerciseKey) {
      setExercises(prev => ({ ...prev, [editingExerciseKey]: exercise }));
      setEditingExerciseKey(null);
    } else {
      const key = `exercise_${Object.keys(exercises).length + 1}`;
      setExercises(prev => ({ ...prev, [key]: exercise }));
    }
    setExerciseModalVisible(false);
  };

  const handleEditExercise = (key: string) => {
    setEditingExerciseKey(key);
    setExerciseModalVisible(true);
  };

  const confirmRemoveExercise = (key: string) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const copy = { ...exercises };
            delete copy[key];
            setExercises(copy);
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView contentContainerStyle={[styles.wrapper, { borderColor: theme.primary, backgroundColor: theme.background }]}>
        <Text style={[styles.formTitle, { color: theme.primary }]}>
          {initialData ? 'Edit Assessment' : 'Create Assessment'}
        </Text>

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
            numberOfLines={6}
            style={[styles.description, { backgroundColor: theme.card, minHeight: 120 }]}
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
            <TouchableOpacity onPress={() => {
              setEditingExerciseKey(null);
              setExerciseModalVisible(true);
            }}>
              <Text style={[styles.plusButton, { color: theme.primary }]}>＋</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseList}>
            {Object.entries(exercises).map(([key, ex]) => (
              <View key={key} style={styles.exerciseItem}>
                <Text style={{ flex: 1, color: theme.text }}>• {ex.enunciate} ({ex.type})</Text>
                <TouchableOpacity onPress={() => handleEditExercise(key)}>
                  <Text style={[styles.editButton, { color: theme.primary }]}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemoveExercise(key)}>
                  <Text style={[styles.deleteButton, { color: theme.primary }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.buttons}>
            <Button title={initialData ? "Update Assessment" : "Save Assessment"} onPress={handleSubmit} variant="primary" />
            <View style={{ marginTop: spacing.md }}>
              <Button title="Cancel" onPress={onClose} variant="secondary" />
            </View>
          </View>
        </View>

        <Dialog visible={errorVisible} message={errorMessage} onClose={() => setErrorVisible(false)} type="error" />
      </ScrollView>

      <Modal visible={showPickerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCentered, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
            </Text>
            <DateTimePicker
              value={dateBuffer}
              mode={pickerMode}
              display="default"
              onChange={(_, selectedDate) => {
                if (selectedDate) setDateBuffer(selectedDate);
              }}
              style={styles.picker}
            />
            <View style={styles.pickerButtons}>
              {pickerMode === 'date' ? (
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => setPickerMode('time')}>
                  <Text style={styles.modalBtnText}>Next: Time</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => {
                  if (pickerField === 'start') setStartDate(dateBuffer);
                  else if (pickerField === 'deadline') setDeadline(dateBuffer);
                  setShowPickerModal(false);
                  setPickerMode('date');
                }}>
                  <Text style={styles.modalBtnText}>Confirm</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => {
                setShowPickerModal(false);
                setPickerMode('date');
              }}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={exerciseModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCentered, { backgroundColor: theme.card }]}>
            <ExerciseForm
              onSubmit={handleAddExercise}
              onCancel={() => {
                setExerciseModalVisible(false);
                setEditingExerciseKey(null);
              }}
              initialData={editingExerciseKey ? exercises[editingExerciseKey] : undefined}
            />
          </View>
        </View>
      </Modal>
    </>
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
  exerciseList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  editButton: {
    fontSize: 18,
  },
  deleteButton: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalCentered: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  picker: {
    width: '100%',
  },
  pickerButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    width: '100%',
    gap: spacing.md,
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: '#aaa',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

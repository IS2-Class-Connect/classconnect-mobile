import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { Course, updateCourse } from '../../../services/coursesApi';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';

export type DialogType = 'error' | 'confirm';

type CourseFormProps = {
  initialValues?: Partial<Course>;
  onSubmit: (data: Omit<Course, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
};

export default function CourseForm({
  initialValues = {},
  onSubmit,
  onCancel = () => {},
  loading = false,
  submitLabel = 'Save',
}: CourseFormProps) {
  const theme = useTheme();
  const { user, authToken } = useAuth();

  const [title, setTitle] = useState(initialValues.title ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [startDate, setStartDate] = useState(new Date(initialValues.startDate ?? Date.now()));
  const [registrationDeadline, setRegistrationDeadline] = useState(new Date(initialValues.registrationDeadline ?? Date.now()));
  const [endDate, setEndDate] = useState(new Date(initialValues.endDate ?? Date.now()));
  const [totalPlaces, setTotalPlaces] = useState(String(initialValues.totalPlaces ?? ''));
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showPicker, setShowPicker] = useState<{
    field: 'start' | 'end' | 'deadline' | null;
    visible: boolean;
  }>({ field: null, visible: false });

  const openPicker = (field: 'start' | 'deadline' | 'end') =>
    setShowPicker({ field, visible: true });

  const closePicker = () => setShowPicker({ field: null, visible: false });

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      switch (showPicker.field) {
        case 'start':
          setStartDate(selectedDate);
          break;
        case 'deadline':
          setRegistrationDeadline(selectedDate);
          break;
        case 'end':
          setEndDate(selectedDate);
          break;
      }
    }
    closePicker();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Title is required.');
      setErrorDialogVisible(true);
      return;
    }
    if (!totalPlaces || isNaN(Number(totalPlaces)) || Number(totalPlaces) <= 0) {
      setErrorMessage('Total Places must be a positive number.');
      setErrorDialogVisible(true);
      return;
    }
    if (!user?.uuid) return;

    const now = new Date();
    if (registrationDeadline <= now) {
      setErrorMessage('Registration deadline must be a future date.');
      setErrorDialogVisible(true);
      return;
    }
    if (startDate <= now) {
      setErrorMessage('Start date must be a future date.');
      setErrorDialogVisible(true);
      return;
    }
    if (endDate <= startDate) {
      setErrorMessage('End date must be after the start date.');
      setErrorDialogVisible(true);
      return;
    }
    if (endDate <= registrationDeadline) {
      setErrorMessage('End date must be after the registration deadline.');
      setErrorDialogVisible(true);
      return;
    }

    const data: Omit<Course, 'id' | 'createdAt'> = {
      title,
      description,
      teacherId: user.uuid,
      totalPlaces: Number(totalPlaces),
      startDate: startDate.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      endDate: endDate.toISOString(),
    };

    if (initialValues.id && authToken) {
      try {
        await updateCourse(initialValues.id, data, authToken);
        Alert.alert('✅ Success', 'Course updated successfully.');
      } catch (e) {
        Alert.alert('❌ Error', 'Failed to update course.');
        return;
      }
    }

    onSubmit(data);
  };

  const renderDateField = (label: string, date: Date, field: 'start' | 'deadline' | 'end') => (
    <TouchableOpacity
      style={[styles.dateField, { borderBottomColor: theme.primary }]}
      onPress={() => openPicker(field)}
    >
      <Ionicons name="calendar-outline" size={20} color={theme.text} />
      <Text style={[styles.dateText, { color: theme.text }]}> 
        {label}: {date.toDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.wrapper, { borderColor: theme.primary }]}>
     <Text style={[styles.formTitle, { color: theme.primary }]}>
      {initialValues.id ? 'Edit Course' : 'Create Your Course'}
      </Text>
      <View style={[styles.form]}>
        <TextField placeholder="Title" value={title} onChangeText={setTitle} />
        <TextField
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          style={styles.description}
        />
        <TextField
          placeholder="Total Places"
          value={totalPlaces}
          onChangeText={setTotalPlaces}
          keyboardType="numeric"
          editable={!initialValues.id}
          autoComplete='off'
        />

        {renderDateField('Registration Deadline', registrationDeadline, 'deadline')}
        {renderDateField('Start Date', startDate, 'start')}
        {renderDateField('End Date', endDate, 'end')}

        <View style={styles.buttons}>
          <Button
            title={submitLabel}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            variant="primary"
          />
          <View style={{ marginTop: spacing.md }}>
            <Button title="Cancel" onPress={onCancel} variant="secondary" />
          </View>
        </View>
      </View>

      {showPicker.visible && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}> 
              <TouchableOpacity style={styles.closeIcon} onPress={closePicker}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <DateTimePicker
                value={
                  showPicker.field === 'start'
                    ? startDate
                    : showPicker.field === 'deadline'
                    ? registrationDeadline
                    : endDate
                }
                mode="date"
                display="inline"
                onChange={handleDateChange}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {showPicker.visible && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={
            showPicker.field === 'start'
              ? startDate
              : showPicker.field === 'deadline'
              ? registrationDeadline
              : endDate
          }
          mode="date"
          display="calendar"
          onChange={handleDateChange}
        />
      )}

      <Dialog
        visible={errorDialogVisible}
        message={errorMessage}
        onClose={() => setErrorDialogVisible(false)}
        type="error"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  form: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  formTitle: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: fonts.size.md,
  },
  buttons: {
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '90%',
    borderRadius: 12,
    padding: spacing.lg,
    position: 'relative',
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
    height: 250,
  },
  closeIcon: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 10,
  },
});

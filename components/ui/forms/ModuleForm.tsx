// components/ui/forms/ModuleForm.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { Module, createModule, patchModule } from '../../../services/modulesMockApi';

interface ModuleFormProps {
  initialValues?: Module;
  courseId: number;
  onClose: () => void;
}

export default function ModuleForm({ initialValues, courseId, onClose }: ModuleFormProps) {
  const theme = useTheme();

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [order, setOrder] = useState(initialValues?.order?.toString() ?? '');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      setErrorMessage('Title is required.');
      setErrorVisible(true);
      return;
    }
    if (!order || isNaN(Number(order))) {
      setErrorMessage('Order must be a valid number.');
      setErrorVisible(true);
      return;
    }

    if (initialValues) {
      patchModule(initialValues.id, { title, description, order: Number(order) });
      Alert.alert('✅ Module updated');
    } else {
      createModule({ title, description, order: Number(order), id_course: courseId });
      Alert.alert('✅ Module created');
    }

    onClose();
  };

  return (
    <View style={[styles.wrapper, { borderColor: theme.primary }]}>      
      <Text style={[styles.formTitle, { color: theme.primary }]}>      
        {initialValues ? 'Edit Module' : 'Create Module'}
      </Text>
      <View style={styles.form}>
        <TextField placeholder="Title" value={title} onChangeText={setTitle} />
        <TextField
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          style={styles.description}
        />
        <TextField
          placeholder="Order"
          value={order}
          onChangeText={setOrder}
          keyboardType="numeric"
        />

        <View style={styles.buttons}>
          <Button title="Save" onPress={handleSubmit} variant="primary" />
          <View style={{ marginTop: spacing.md }}>
            <Button title="Cancel" onPress={onClose} variant="secondary" />
          </View>
        </View>
      </View>

      <Dialog
        visible={errorVisible}
        message={errorMessage}
        onClose={() => setErrorVisible(false)}
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttons: {
    marginTop: spacing.lg,
  },
});

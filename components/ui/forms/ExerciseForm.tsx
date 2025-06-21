import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import TextField from '../fields/TextField';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { AssessmentExercise, ExerciseType } from '../../../services/assessmentsApi';

type Props = {
  onSubmit: (exercise: AssessmentExercise) => void;
  onCancel: () => void;
  initialData?: AssessmentExercise;
};

export default function ExerciseForm({ onSubmit, onCancel, initialData }: Props) {
  const theme = useTheme();

  const [type, setType] = useState<ExerciseType>('open');
  const [enunciate, setEnunciate] = useState('');
  const [link, setLink] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [choiceInput, setChoiceInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [editingChoiceIndex, setEditingChoiceIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setEnunciate(initialData.enunciate);
      setLink(initialData.link ?? '');
      setChoices(initialData.choices ?? []);
      setAnswer(initialData.answer ?? '');
    }
  }, [initialData]);

  const handleAddOrUpdateChoice = () => {
    const trimmed = choiceInput.trim();
    if (!trimmed) return;

    const duplicate = choices.some((c, i) =>
      c.toLowerCase() === trimmed.toLowerCase() && i !== editingChoiceIndex
    );
    if (duplicate) {
      setError('This choice already exists.');
      return;
    }

    if (editingChoiceIndex !== null) {
      const newChoices = [...choices];
      const old = newChoices[editingChoiceIndex];
      newChoices[editingChoiceIndex] = trimmed;
      setChoices(newChoices);
      if (answer === old) setAnswer(trimmed);
      setEditingChoiceIndex(null);
    } else {
      setChoices(prev => [...prev, trimmed]);
    }

    setChoiceInput('');
    setError('');
  };

  const handleEditChoice = (index: number) => {
    setChoiceInput(choices[index]);
    setEditingChoiceIndex(index);
    setError('');
  };

  const handleRemoveChoice = (index: number) => {
    const newChoices = [...choices];
    const removed = newChoices.splice(index, 1)[0];
    setChoices(newChoices);
    if (answer === removed) setAnswer('');
    if (editingChoiceIndex === index) {
      setChoiceInput('');
      setEditingChoiceIndex(null);
    }
    setError('');
  };

    const handleSave = () => {
    if (!enunciate.trim()) {
      setError('Enunciate is required.');
      return;
    }

    if (link && !/^https?:\/\/.+/.test(link.trim())) {
      setError('The link must start with http:// or https://');
      return;
    }

    if (type === 'multiple_choice') {
      if (choices.length < 2) {
        setError('At least two choices are required.');
        return;
      }
      if (!answer.trim()) {
        setError('Please select the correct answer.');
        return;
      }
    }

    const exercise: AssessmentExercise = {
      type,
      enunciate: enunciate.trim() || '',
      link: link.trim() || undefined,
      choices: type === 'multiple_choice' ? choices : undefined,
      answer: type === 'multiple_choice' ? answer.trim() || undefined : undefined,
    };

    onSubmit(exercise);
  };


  return (
    <ScrollView contentContainerStyle={[styles.wrapper, { backgroundColor: theme.background, borderColor: theme.primary }]}>
      <Text style={[styles.title, { color: theme.primary }]}>
        {initialData ? 'Edit Exercise' : 'Add Exercise'}
      </Text>

      <View style={styles.selectorRow}>
        {(['open', 'multiple_choice'] as ExerciseType[]).map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => {
              setType(option);
              setError('');
            }}
            style={[styles.typeButton, {
              backgroundColor: type === option ? theme.primary : theme.card,
              borderColor: theme.primary,
            }]}
          >
            <Text style={[styles.typeButtonText, { color: type === option ? '#fff' : theme.text }]}>
              {option === 'open' ? 'Open' : 'Multiple Choice'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextField
      placeholder="Enunciate"
      value={enunciate}
      onChangeText={text => {
        setEnunciate(text);
        setError('');
      }}
      multiline
      numberOfLines={5}
      style={[
        styles.textArea,
        {
          backgroundColor: theme.card,
          width: '100%',
          maxWidth: '100%',
          flexGrow: 0,
          flexShrink: 0,
          alignSelf: 'stretch',
          textAlignVertical: 'top',
          textAlign: 'left',
        }
      ]}
    />


      <TextField
        placeholder="Link (optional)"
        value={link}
        onChangeText={setLink}
        style={{
          backgroundColor: theme.card,
          width: '100%',
          maxWidth: '100%',
          flexGrow: 0,
          flexShrink: 0,
          alignSelf: 'stretch',
          textAlign: 'left',
        }}
      />


      {type === 'multiple_choice' && (
        <>
          <View style={styles.choicesHeader}>
            <Text style={[styles.choicesTitle, { color: theme.text }]}>Choices</Text>
            <TouchableOpacity onPress={handleAddOrUpdateChoice}>
              <Text style={[styles.plusButton, { color: theme.primary }]}>
                {editingChoiceIndex !== null ? '✎' : '＋'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextField
            placeholder="New Choice"
            value={choiceInput}
            onChangeText={text => {
              setChoiceInput(text);
              setError('');
            }}
            style={{ backgroundColor: theme.card }}
          />

          <Text style={[styles.instruction, { color: theme.text }]}>Tap a choice to mark it as correct</Text>

          <View style={{ marginTop: spacing.sm }}>
            {choices.map((c, i) => (
              <View key={i} style={styles.choiceRow}>
                <TouchableOpacity
                  style={[styles.choiceItem, {
                    borderColor: theme.primary,
                    backgroundColor: answer === c ? theme.primary : theme.card,
                  }]}
                  onPress={() => {
                    setAnswer(c);
                    setError('');
                  }}
                  onLongPress={() => handleEditChoice(i)}
                >
                  <Text style={{ color: answer === c ? '#fff' : theme.text }}>• {c}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveChoice(i)}>
                  <Text style={[styles.deleteButton, { color: theme.primary }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.buttons}>
        <Button title={initialData ? "Update Exercise" : "Save Exercise"} onPress={handleSave} variant="primary" />
        <View style={{ marginTop: spacing.sm }}>
          <Button title="Cancel" onPress={onCancel} variant="secondary" />
        </View>
      </View>

      <Dialog visible={!!error} message={error} onClose={() => setError('')} type="error" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
    margin: spacing.lg,
  },
  title: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  buttons: {
    marginTop: spacing.lg,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  typeButtonText: {
    fontSize: fonts.size.md,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: fonts.size.md,
    textAlignVertical: 'top',
  },
  choicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  choicesTitle: {
    fontSize: fonts.size.md,
    fontWeight: 'bold',
  },
  plusButton: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  instruction: {
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 4,
  },
  choiceItem: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
  },
  deleteButton: {
    fontSize: 18,
  },
});

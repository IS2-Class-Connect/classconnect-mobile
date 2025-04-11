// ✅ components/ui/TextField.tsx
import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';

export default function TextField(props: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      {...props}
      style={[styles.input, { color: theme.text, borderColor: theme.border }, props.style]}
      placeholderTextColor={theme.icon}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
});
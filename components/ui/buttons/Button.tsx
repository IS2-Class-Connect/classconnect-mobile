// ✅ components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  textColor?: string;
}

export default function Button({ title, onPress, variant = 'primary', textColor }: ButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'primary' ? theme.buttonPrimary : theme.buttonSecondary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: textColor || '#fff' }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    fontWeight: fonts.weight.bold as '700',
    fontSize: fonts.size.md,
  },
});
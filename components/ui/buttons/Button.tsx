// ✅ components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  textColor,
  disabled = false,
  loading = false 
}: ButtonProps) {
  const theme = useTheme();

  const backgroundColor = variant === 'primary' 
    ? theme.buttonPrimary 
    : theme.buttonSecondary;

  const buttonStyles = [
    styles.button,
    { backgroundColor },
    disabled && { opacity: 0.6 }
  ];

  const textStyles = [
    styles.text,
    { color: textColor || '#fff' },
    disabled && { opacity: 0.8 }
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={textColor || '#fff'} 
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44, 
    justifyContent: 'center',
  },
  text: {
    fontWeight: fonts.weight.bold as '700',
    fontSize: fonts.size.md,
  },
});
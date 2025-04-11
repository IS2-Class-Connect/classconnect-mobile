import React from 'react';
import {
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ImageSourcePropType,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';

interface IconButtonProps {
  title: string;
  icon: ImageSourcePropType;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

export default function IconButton({
  title,
  icon,
  onPress,
  variant = 'secondary',
  disabled = false,
  loading = false,
}: IconButtonProps) {
  const theme = useTheme();

  const buttonStyles = [
    styles.button,
    { backgroundColor: '#ffffff' },
    disabled && { opacity: 0.6 }
  ];

  const textStyles = [
    styles.text,
    { color: theme.buttonPrimary },
    disabled && { opacity: 0.8 }
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            color={theme.buttonPrimary}
            style={styles.loader}
          />
        ) : (
          <>
            <Image 
              source={icon} 
              style={[
                styles.icon,
                disabled && { opacity: 0.5 }
              ]} 
              resizeMode="contain" 
            />
            <Text style={textStyles}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 50,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
  },
  icon: {
    width: 45,
    height: 45,
    marginRight: spacing.sm,
  },
  text: {
    fontSize: fonts.size.md,
    fontWeight: fonts.weight.bold as '700',
  },
  loader: {
    width: 45,
    height: 45,
  }
});
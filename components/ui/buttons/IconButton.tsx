import React from 'react';
import {
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ImageSourcePropType,
  View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';

interface IconButtonProps {
  title: string;
  icon: ImageSourcePropType;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export default function IconButton({
  title,
  icon,
  onPress,
  variant = 'secondary',
}: IconButtonProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: '#ffffff' }]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Image source={icon} style={styles.icon} resizeMode="contain" />
        <Text style={[styles.text, { color: theme.buttonPrimary }]}>{title}</Text>
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
});

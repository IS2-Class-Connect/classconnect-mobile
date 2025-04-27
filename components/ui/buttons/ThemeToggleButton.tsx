// components/ui/ThemeToggleButton.tsx
import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleButtonProps {
  size?: number;
  style?: object;
}

export default function ThemeToggleButton({ 
  size = 24, 
  style 
}: ThemeToggleButtonProps) {
  const theme = useTheme();
  
  // Animation values
  const rotateAnim = useRef(new Animated.Value(theme.dark ? 1 : 0)).current;
  
  // Update animation when theme changes
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: theme.dark ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [theme.dark]);
  
  // Interpolate rotation and opacity
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  const sunOpacity = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const moonOpacity = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: theme.buttonSecondary,
          borderColor: theme.border
        },
        style
      ]}
      onPress={theme.toggleTheme}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.container, { transform: [{ rotate: rotation }] }]}>
        {/* Sun icon */}
        <Animated.View style={[styles.iconWrapper, { opacity: sunOpacity }]}>
          <Ionicons name="sunny" size={size} color={theme.text} />
        </Animated.View>
        
        {/* Moon icon */}
        <Animated.View style={[styles.iconWrapper, { opacity: moonOpacity }]}>
          <Ionicons name="moon" size={size} color={theme.text} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
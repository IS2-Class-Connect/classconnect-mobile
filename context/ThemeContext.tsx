import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { colors } from '../constants/colors';
import { useColorScheme } from 'react-native';

// Define the theme type that includes the dark property and toggle function
type ThemeContextType = typeof colors.light & { 
  dark: boolean;
  toggleTheme: () => void;
};

// Create the context with default values
export const ThemeContext = createContext<ThemeContextType>({
  ...colors.light,
  dark: false,
  toggleTheme: () => {}, // Default empty function
});

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component that manages the application's theme
 * It uses the device's color scheme as the initial theme
 * and provides a function to toggle between light and dark themes
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the device's color scheme
  const deviceColorScheme = useColorScheme();
  
  // Initialize theme state based on device preference
  const [isDark, setIsDark] = useState(deviceColorScheme === 'dark');
  
  // Update theme if device color scheme changes
  useEffect(() => {
    setIsDark(deviceColorScheme === 'dark');
  }, [deviceColorScheme]);
  
  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setIsDark(prevIsDark => !prevIsDark);
  };
  
  // Create the theme object based on current state
  const theme = isDark 
    ? { ...colors.dark, dark: true, toggleTheme } 
    : { ...colors.light, dark: false, toggleTheme };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 * @returns The current theme context value
 */
export const useTheme = () => useContext(ThemeContext);
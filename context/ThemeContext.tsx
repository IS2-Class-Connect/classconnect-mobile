import React, { createContext, useContext, ReactNode } from 'react';
import { colors } from '../constants/colors';
import { useColorScheme } from 'react-native';

// Define a type that includes the dark property
type ThemeType = typeof colors.light & { dark: boolean };


export const ThemeContext = createContext<ThemeType>({
  ...colors.light,
  dark: false,
});


interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // const colorScheme = useColorScheme();
  // const theme = colorScheme === 'dark'
  //   ? { ...colors.dark, dark: true }
  //   : { ...colors.light, dark: false };


  //const theme = { ...colors.light, dark: false };

  const theme = { ...colors.dark, dark: true };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

import React, { createContext, useContext, ReactNode } from 'react';
import { colors } from '../constants/colors';
import { useColorScheme } from 'react-native';

// Define a type that includes the dark property
type ThemeType = typeof colors.light & { dark: boolean };

// Create a context with a default theme that includes the dark property
const ThemeContext = createContext<ThemeType>({ ...colors.light, dark: false });

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {

    // Use the useColorScheme hook to get the current color scheme
    // This will allow us to switch between light and dark themes based on the device settings



    // if you descomment this the system detect the color scheme
  //  const colorScheme = useColorScheme();
  
  //  const theme = colorScheme === 'dark'
  //    ? { ...colors.dark, dark: true }
  //    : { ...colors.light, dark: false };

     //default to dark mode
   const theme = {...colors.dark, dark: true};
  // default to light mode
 //const theme = {...colors.light, dark: false};

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

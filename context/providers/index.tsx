import React from 'react';
import { ThemeProvider } from '../ThemeContext';
import { AuthProvider } from '../AuthContext';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
};

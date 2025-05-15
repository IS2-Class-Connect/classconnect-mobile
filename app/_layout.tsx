// app/_layout.tsx
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { AppProviders } from '../context/providers';

export default function RootLayout() {
  const theme = useTheme();

  return (
    <AppProviders>
      <Slot />
      <StatusBar
        backgroundColor={theme.background}
        style={theme.dark ? 'light' : 'dark'}
      />
    </AppProviders>
  );
}

// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { AppProviders } from '../context/providers';

function LayoutContent() {
  const theme = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
        <Stack.Screen name="+not-found" />
      </Stack>

      <StatusBar
        backgroundColor={theme.background}
        style={theme.dark ? 'light' : 'dark'}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      {/* Provide app-wide context */}
      <LayoutContent />
    </AppProviders>
  );
}

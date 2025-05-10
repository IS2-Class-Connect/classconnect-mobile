// app/(courses)/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function CoursesLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}

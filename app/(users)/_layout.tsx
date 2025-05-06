// app/(users)/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function UsersLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
      }}
    />
  );
}

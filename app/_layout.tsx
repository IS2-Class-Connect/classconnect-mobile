import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { AppProviders } from '../context/providers';

function LayoutContent() {
	const theme = useTheme(); // Get theme from context

	return (
		<>
			<Stack
				screenOptions={{
					headerStyle: { backgroundColor: theme.background }, // Set header background color
					headerTintColor: theme.text, // Set header text color
				}}
			>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} /> {/* Main tab navigation */}
				<Stack.Screen name="auth/login" options={{ title: 'Login' }} /> {/* Login screen */}
				<Stack.Screen name="auth/register" options={{ title: 'Register' }} /> {/* Register screen */}
				<Stack.Screen name="+not-found" /> {/* Fallback screen */}
			</Stack>

			<StatusBar
				backgroundColor={theme.background} // Set status bar background color
				style={theme.dark ? 'light' : 'dark'} // Adjust status bar style based on theme
			/>
		</>
	);
}

export default function RootLayout() {
	return (
		<AppProviders> {/* Provide app-wide context */}
			<LayoutContent />
		</AppProviders>
	);
}

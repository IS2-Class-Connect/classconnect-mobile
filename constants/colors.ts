const tintColorLight = '#007AFF'; // Primary blue for light mode
const tintColorDark = '#339CFF';  // Bright blue for dark mode

export const colors = {
  light: {
    text: '#1C1C1E',             // Primary text (dark gray)
    background: '#FFFFFF',       // Background (white)
    surface: '#F2F2F7',          // Secondary background (light gray)
    border: '#DADADA',           // Border color for input fields, buttons
    card: '#FAFAFA',             // Background for cards or panels
    tint: tintColorLight,        // Main accent (buttons, links)
    icon: '#4A90E2',             // Secondary blue for icons
    buttonPrimary: tintColorLight,
    buttonSecondary: '#AAC0E2',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    tabIconDefault: '#B0B0B0',   // Inactive tab icon (gray)
    tabIconSelected: tintColorLight, // Active tab icon (blue)

    // Required by ThemeProvider
    primary: tintColorLight,     // Primary color for the theme
    notification: '#FF3B30',     // Notification badge color
  },
  dark: {
    text: '#ECEDEE',             // Primary text (light gray)
    background: '#0B0B0B',       // Background (almost black)
    surface: '#1C1C1E',          // Secondary background (dark gray)
    border: '#3A3A3A',           // Border color for input fields, buttons
    card: '#121212',             // Background for cards or panels
    tint: tintColorDark,         // Main accent (bright blue)
    icon: '#5FA9F9',             // Light blue for icons
    buttonPrimary: tintColorDark,
    buttonSecondary: '#4A90E2',
    error: '#FF453A',
    warning: '#FF9F0A',
    success: '#32D74B',
    tabIconDefault: '#4A4A4A',   // Inactive tab icon (gray)
    tabIconSelected: tintColorDark, // Active tab icon (blue)

    // Required by ThemeProvider
    primary: tintColorDark,      // Primary color for the theme
    notification: '#FF453A',     // Notification badge color
  },
};

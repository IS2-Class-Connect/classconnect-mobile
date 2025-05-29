import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { updateUserNotificationConfiguration } from '@/services/userApi';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const theme = useTheme();
  const { authToken, user, logout } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState({
    pushTaskAssignment: true,
    pushMessageReceived: true,
    pushDeadlineReminder: true,
    emailEnrollment: true,
    emailAssistantAssignment: true,
  });

  useEffect(() => {
    if (user) {
      setSettings({
        pushTaskAssignment: user.pushTaskAssignment,
        pushMessageReceived: user.pushMessageReceived,
        pushDeadlineReminder: user.pushDeadlineReminder,
        emailEnrollment: user.emailEnrollment,
        emailAssistantAssignment: user.emailAssistantAssignment,
      });
    }
  }, [user]);

  const toggleSetting = async (key: keyof typeof settings) => {
    if (!user || !authToken) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await updateUserNotificationConfiguration(user.uuid, updated, authToken);
    } catch (e) {
      console.error('❌ Error setting notification settings:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Push Notifications</Text>

      <SettingToggle
        label="Task Assignment"
        value={settings.pushTaskAssignment}
        onToggle={() => toggleSetting('pushTaskAssignment')}
      />
      <SettingToggle
        label="Message Received"
        value={settings.pushMessageReceived}
        onToggle={() => toggleSetting('pushMessageReceived')}
      />
      <SettingToggle
        label="Deadline Reminder"
        value={settings.pushDeadlineReminder}
        onToggle={() => toggleSetting('pushDeadlineReminder')}
      />

      <View style={styles.divider} />

      <Text style={[styles.title, { color: theme.text }]}>Email Notifications</Text>

      <SettingToggle
        label="Enrollment"
        value={settings.emailEnrollment}
        onToggle={() => toggleSetting('emailEnrollment')}
      />
      <SettingToggle
        label="Assistant Assignment"
        value={settings.emailAssistantAssignment}
        onToggle={() => toggleSetting('emailAssistantAssignment')}
      />

      <View style={styles.divider} />

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: '#FF3B30' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingToggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor="#fff"
        trackColor={{ false: '#ccc', true: '#339CFF' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#ffffff10',
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 16,
    flexShrink: 1,
  },
  divider: {
    height: spacing.lg,
  },
  logoutButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

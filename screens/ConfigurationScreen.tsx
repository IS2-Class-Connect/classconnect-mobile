
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import {
  Course,
  getAllCourses,
  getCourseEnrollments,
  createCourse,
  Enrollment,
} from '../services/coursesApi';
import { useAuth } from '../context/AuthContext';
import { updateUserNotificationConfiguration } from '@/services/userApi';

export default function SettingsScreen() {
  const theme = useTheme();
  const { authToken, user } = useAuth();

  const [settings, setSettings] = useState({
    pushTaskAssignment: true,
    pushMessageReceived: true,
    pushDeadlineReminder: true,
    emailEnrollment: true,
    emailAssistantAssignment: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    if (user?.uuid && authToken) {
      updateUserNotificationConfiguration(user.uuid, updated, authToken);
    }
  }

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

      <Text style={[styles.padding]}></Text>
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
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: '#ddd',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  padding: {
    paddingVertical: 18,
  }
});

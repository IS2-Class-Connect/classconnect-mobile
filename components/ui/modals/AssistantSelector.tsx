import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useAuth } from '../../../context/AuthContext';
import { getAllUsers, User } from '../../../services/userApi';
import { enrollInCourse, deleteEnrollment } from '../../../services/coursesApi';
import { Ionicons } from '@expo/vector-icons';
import { sendAssistantAssignmentEmail, sendEnrollmentEmail } from '../../../services/emailService';

interface AssistantSelectorProps {
  visible: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
  enrollments: { userId: string; role: 'STUDENT' | 'ASSISTANT' }[];
}

export default function AssistantSelector({ visible, onClose, courseId, courseName, enrollments }: AssistantSelectorProps)
{
  const theme = useTheme();
  const { authToken, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) fetchUsers();
  }, [visible]);

  const fetchUsers = async () => {
    if (!authToken || !currentUser) return;
    try {
      const all = await getAllUsers(authToken);

      const eligible = all.filter(
        u => u.uuid && u.uuid !== currentUser.uuid
      );

      setUsers(eligible);
      setFilteredUsers(eligible);
    } catch (e) {
      console.error('❌ Error loading users:', e);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = users.filter((u) =>
      u.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleAddAssistant = (selectedUser: User) => {
    Alert.alert(
      'Add Assistant',
      `Do you want to add ${selectedUser.name} as an assistant?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              if (!authToken || !currentUser) return;
              const isStudent = enrollments.some(
                (e) => e.userId === selectedUser.uuid && e.role === 'STUDENT'
              );
              if (isStudent) {
                // await patchEnrollment(courseId, selectedUser.uuid, authToken, 'ASSISTANT');
              } else {
                await enrollInCourse(courseId, selectedUser.uuid, authToken, 'ASSISTANT');
              }
              await sendAssistantAssignmentEmail(
                selectedUser.uuid,
                selectedUser.name,
                currentUser.name,
                courseName,
                selectedUser.email
              );
              
              Alert.alert('✅ Success', `${selectedUser.name} is now an assistant.`);
              onClose();
            } catch (error) {
              console.error('❌ Error adding assistant:', error);
              Alert.alert('❌ Error', 'Could not add assistant.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveAssistant = (selectedUser: User) => {
    Alert.alert(
      'Remove Assistant',
      `Do you want to remove ${selectedUser.name} as an assistant?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!authToken) return;
              await deleteEnrollment(courseId, selectedUser.uuid, authToken);
              Alert.alert('✅ Removed', `${selectedUser.name} is no longer an assistant.`);
              onClose();
            } catch (error) {
              console.error('❌ Error removing assistant:', error);
              Alert.alert('❌ Error', 'Could not remove assistant.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.primary }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Assistant</Text>
          <TextInput
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={handleSearch}
            style={[styles.searchInput, { color: theme.text }]}
            placeholderTextColor="#aaa"
          />

          <FlatList
            data={filteredUsers}
            keyExtractor={(item, index) => item.uuid ?? `fallback-${index}`}
            renderItem={({ item }) => {
              const isAssistant = enrollments.some(
                e => e.userId === item.uuid && e.role === 'ASSISTANT'
              );
              return (
                <View style={styles.userRow}>
                  {item.urlProfilePhoto && (
                    <Image source={{ uri: item.urlProfilePhoto }} style={styles.avatar} />
                  )}
                  <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      isAssistant ? handleRemoveAssistant(item) : handleAddAssistant(item)
                    }
                  >
                    <Ionicons
                      name={isAssistant ? 'person-remove-outline' : 'person-add-outline'}
                      size={24}
                      color={isAssistant ? theme.error : theme.primary}
                    />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: theme.text, textAlign: 'center', marginTop: spacing.lg }}>
                No users found.
              </Text>
            }
          />

          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: theme.primary }]}>
            <Text style={[styles.closeText, { color: theme.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
  },
  modalTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: spacing.sm,
    fontSize: fonts.size.md,
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  userName: {
    flex: 1,
    fontSize: fonts.size.md,
    fontWeight: '500',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  closeBtn: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeText: {
    fontSize: fonts.size.md,
    fontWeight: '500',
  },
});

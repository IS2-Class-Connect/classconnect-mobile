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
import { enrollInCourse } from '../../../services/coursesApi';
import { Ionicons } from '@expo/vector-icons';

interface AssistantSelectorProps {
  visible: boolean;
  onClose: () => void;
  courseId: number;
  existingAssistants: string[];
}

export default function AssistantSelector({ visible, onClose, courseId, existingAssistants }: AssistantSelectorProps) {
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
        (u) =>
          u.uuid !== currentUser.uuid &&
          !existingAssistants.includes(u.uuid)
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
              if (!authToken) return;
              await enrollInCourse(courseId, selectedUser.uuid, authToken, 'ASSISTANT');
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

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.background }]}>  
        <TextInput
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={[styles.searchInput, { color: theme.text }]}
          placeholderTextColor="#aaa"
        />

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uuid}
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              {item.urlProfilePhoto && (
                <Image source={{ uri: item.urlProfilePhoto }} style={styles.avatar} />
              )}
              <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleAddAssistant(item)}>
                <Ionicons name="person-add-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.text, textAlign: 'center', marginTop: spacing.lg }}>
              No users found.
            </Text>
          }
        />

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
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
    marginTop: spacing.lg,
    padding: spacing.sm,
    backgroundColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: {
    fontSize: fonts.size.md,
    fontWeight: '500',
  },
});

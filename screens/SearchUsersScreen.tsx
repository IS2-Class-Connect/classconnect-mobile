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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { getAllUsers, User } from '../services/userApi';
import UserDetailsModal from '../components/ui/modals/UsersDetailsModal';
import { Ionicons } from '@expo/vector-icons'; // 👉 Import for icon

export default function SearchUsersScreen() {
  const theme = useTheme();
  const router = useRouter(); // 👉 Needed for back navigation
  const { user: currentUser, authToken } = useAuth(); 
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      if (!authToken || !currentUser) {
        console.log('🚨 No auth token or user available');
        return;
      }
      const allUsers = await getAllUsers(authToken);
      const usersWithoutCurrent = allUsers.filter((u) => u.email !== currentUser.email);
      const sorted = usersWithoutCurrent.sort((a, b) => a.name.localeCompare(b.name));

      setUsers(sorted);
      setFilteredUsers(sorted);
    } catch (error) {
      console.log('🚨 Error fetching users:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#339CFF" />
      </TouchableOpacity>

      {/* Search input field */}
      <TextInput
        style={[styles.searchInput, { backgroundColor: theme.surface, color: theme.text }]}
        placeholder="Search users..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* Users list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.email} 
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item)}>
            {item.urlProfilePhoto && (
              <Image
                source={{ uri: item.urlProfilePhoto }}
                style={styles.avatar}
              />
            )}
            <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.text, marginTop: spacing.lg, textAlign: 'center' }}>
            No users found.
          </Text>
        }
      />

      {/* Modal showing full user details */}
      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={closeUserModal} />
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: spacing.sm,
    marginBottom: spacing.md,
    fontSize: fonts.size.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: fonts.size.md,
    fontWeight: '500',
  },
});

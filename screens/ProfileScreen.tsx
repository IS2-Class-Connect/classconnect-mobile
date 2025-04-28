import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import { useRouter } from 'expo-router';
import EditForm from '../components/ui/forms/EditForm';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [locationName, setLocationName] = useState<string>('Unknown location');
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (user?.latitude != null && user?.longitude != null) {
      fetchLocationName(user.latitude, user.longitude);
    }
  }, [user?.latitude, user?.longitude]);

  const fetchLocationName = async (latitude: number, longitude: number) => {
    setLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      if (data?.address) {
        const { city, town, village, state, country } = data.address;
        const location = city || town || village || state || 'Unknown area';
        setLocationName(`${location}, ${country}`);
      } else {
        setLocationName('Unknown location');
      }
    } catch (error) {
      console.log('Error fetching location name:', error);
      setLocationName('Unknown location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const formatAccountStatus = () => {
    if (user?.accountLocked && user.lockUntil) {
      return `Locked until ${new Date(user.lockUntil).toLocaleDateString()}`;
    }
    return 'Active';
  };

  const formatAccountAge = () => {
    if (!user?.createdAt) return 'Unknown creation date';
    const createdDate = new Date(user.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Created today';
    if (diffDays === 1) return 'Created 1 day ago';
    if (diffDays < 30) return `Created ${diffDays} days ago`;
    if (diffDays < 365) return `Created ${Math.floor(diffDays / 30)} months ago`;
    return `Created ${Math.floor(diffDays / 365)} years ago`;
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const handleEditProfile = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <EditForm
              initialName={user?.name ?? ''}
              initialDescription={user?.description ?? ''}
              initialProfilePhoto={user?.urlProfilePhoto ?? ''}
              initialEmail={user?.email ?? ''}
              onClose={handleCloseModal}
            />
          </View>
        </View>
      </Modal>

      {/* Profile Information */}
      {user?.urlProfilePhoto && (
        <Image source={{ uri: user.urlProfilePhoto }} style={styles.avatar} />
      )}

      <Text style={[styles.name, { color: theme.text }]}>
        {user?.name ?? 'No Name'}
      </Text>

      <Text style={[styles.email, { color: theme.text }]}>
        {user?.email ?? 'No Email'}
      </Text>

      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Biography</Text>
        <Text style={[styles.info, { color: theme.text }]}>
          {user?.description || 'No biography provided.'}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Account Status</Text>
        <Text style={[styles.info, { color: theme.text }]}>
          {formatAccountStatus()}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Location</Text>
        {loadingLocation ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <Text style={[styles.info, { color: theme.text }]}>
            {locationName}
          </Text>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Account Created</Text>
        <Text style={[styles.info, { color: theme.text }]}>
          {formatAccountAge()}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: fonts.size.md,
    marginBottom: spacing.lg,
  },
  infoSection: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.size.sm,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  info: {
    fontSize: fonts.size.md,
  },
  buttonsContainer: {
    marginTop: spacing.xl,
    width: '100%',
  },
  editButton: {
    backgroundColor: '#339CFF',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
  },
});

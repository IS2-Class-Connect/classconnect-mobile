// app/(tabs)/profile.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../constants/spacing';
import { useRouter } from 'expo-router';
import EditForm from '../components/ui/forms/EditForm';
import UserProfileInfo from '../components/ui/cards/UserProfileCard';
import { Feather } from '@expo/vector-icons'; // 👈 íconos

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout, refreshUserData } = useAuth();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
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
            router.replace('/auth/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    setModalVisible(true);
  };

  const handleCloseModal = async () => {
    setModalVisible(false);
    await refreshUserData();
  };

  const handleSearchUsers = () => {
    router.push('/users/search-users');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Edit Profile Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
        transparent={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
        </TouchableWithoutFeedback>
      </Modal>

      {/* User Profile Info */}
      {user && (
        <UserProfileInfo
          user={user}
          locationName={locationName}
          loadingLocation={loadingLocation}
          onProfilePhotoPress={() => setPhotoModalVisible(true)}
        />
      )}

      {/* Action Buttons (with icons) */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={handleEditProfile} style={styles.iconButton}>
          <Feather name="edit-3" size={28} color="#339CFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSearchUsers} style={styles.iconButton}>
          <Feather name="users" size={28} color="#339CFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <Feather name="log-out" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Profile Photo Fullscreen Modal */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPhotoModalVisible(false)}>
          <View style={styles.photoModalOverlay}>
            {user?.urlProfilePhoto && (
              <Image
                source={{ uri: user.urlProfilePhoto }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
  },
  buttonsContainer: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  iconButton: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
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
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
  },
});

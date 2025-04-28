import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { fonts } from '../constants/fonts';
import { useRouter } from 'expo-router';
import EditForm from '../components/ui/forms/EditForm';
import UserProfileInfo from '../components/ui/cards/UserProfileCard';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout, refreshUserData } = useAuth();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false); // Modal for profile photo
  const [locationName, setLocationName] = useState<string>('Unknown location');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Fetch location name based on user coordinates
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

  // Logout with confirmation
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

  // Open edit profile modal
  const handleEditProfile = () => {
    setModalVisible(true);
  };

  // Close edit profile modal and refresh user data
  const handleCloseModal = async () => {
    setModalVisible(false);
    await refreshUserData();
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

      {/* User Profile Info (Reusable component) */}
      {user && (
        <UserProfileInfo
          user={user}
          locationName={locationName}
          loadingLocation={loadingLocation}
          onProfilePhotoPress={() => setPhotoModalVisible(true)} // 👈 Open photo modal
        />
      )}

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.buttonText}>Logout</Text>
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

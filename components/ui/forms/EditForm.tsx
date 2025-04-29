// components/ui/forms/EditForm.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { uploadImageAsync } from '../../../firebase/upload';
import { updateUserProfile } from '../../../services/userApi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import UserProfileInfo from '../cards/UserProfileCard';
import SetLocationForm from './SetLocationForm';

interface EditFormProps {
  initialName: string;
  initialDescription: string;
  initialProfilePhoto: string;
  initialEmail: string;
  onClose: () => void;
}

export default function EditForm({
  initialName,
  initialDescription,
  initialProfilePhoto,
  initialEmail,
  onClose,
}: EditFormProps) {
  const theme = useTheme();
  const { user, authToken, refreshUserData } = useAuth();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [email, setEmail] = useState(initialEmail);
  const [image, setImage] = useState<string | null>(initialProfilePhoto);
  const [uploading, setUploading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
    setEmail(initialEmail);
    setImage(initialProfilePhoto);
  }, [initialName, initialDescription, initialEmail, initialProfilePhoto]);

  useEffect(() => {
    if (user?.latitude && user?.longitude) {
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

  const showDialog = (message: string, type: 'success' | 'error') => {
    setDialogMessage(message);
    setDialogType(type);
    setDialogVisible(true);
  };

  const openPreview = () => setPreviewVisible(true);
  const closePreview = () => setPreviewVisible(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = async () => {
    console.log('🔵 Starting handleSave');

    if (!name.trim() || !email.trim()) {
      showDialog('Name and email cannot be empty.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showDialog('Invalid email format.', 'error');
      return;
    }

    if (!user || !authToken) {
      showDialog('User not authenticated.', 'error');
      return;
    }

    setUploading(true);

    try {
      let newProfilePhotoUrl = initialProfilePhoto;
      if (image && image !== initialProfilePhoto) {
        try {
          console.log('📷 Uploading new profile photo...');
          newProfilePhotoUrl = await uploadImageAsync(image, `users/${user.uuid}/profilePhoto.jpg`);
          console.log('✅ Profile photo uploaded.');
        } catch (uploadError) {
          console.log('❌ Error uploading photo:', uploadError);
          showDialog('Failed to upload profile photo.', 'error');
          setUploading(false);
          return;
        }
      }

      try {
        console.log('🧾 Updating backend user profile...');
        await updateUserProfile(
          user.uuid,
          { name, email, urlProfilePhoto: newProfilePhotoUrl, description },
          authToken
        );
        console.log('✅ Backend user profile updated.');
      } catch (backendError) {
        console.log('❌ Backend update error:', backendError);
        showDialog('Failed to update backend user profile.', 'error');
        setUploading(false);
        return;
      }

      await refreshUserData();
      console.log('✅ User data refreshed.');
      showDialog('Profile updated successfully!', 'success');
    } catch (error) {
      console.log('❌ Unexpected error in handleSave:', error);
      showDialog('Unexpected error.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>

          {image && (
            <Image source={{ uri: image }} style={styles.avatar} />
          )}
          <TouchableOpacity onPress={handlePickImage} style={styles.pickButton}>
            <Text style={[styles.pickButtonText, { color: theme.tabIconSelected }]}>Choose New Photo</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, styles.bioInput, { backgroundColor: theme.surface, color: theme.text }]}
            placeholder="Biography"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.locationRowContainer}>
            <TextInput
              style={[styles.input, styles.locationInput, { backgroundColor: theme.surface, color: theme.text }]}
              placeholder="Location not set"
              placeholderTextColor="#999"
              value={loadingLocation ? 'Loading...' : locationName}
              editable={false}
            />
            <TouchableOpacity
              onPress={() => setShowLocationModal(true)}
              style={styles.updateLocationButton}
              disabled={uploading}
            >
              <Text style={{ color: theme.primary, fontWeight: 'bold', textAlign: 'center' }}>
                Update
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title={uploading ? "Saving..." : "Update Profile"}
            onPress={openPreview}
            disabled={uploading}
            variant="primary"
          />
          <Button
            title="Cancel"
            onPress={onClose}
            disabled={uploading}
            variant="secondary"
          />
        </View>
      </TouchableWithoutFeedback>

      <Dialog
        visible={dialogVisible}
        message={dialogMessage}
        onClose={() => {
          setDialogVisible(false);
          if (dialogType === 'success') {
            setTimeout(() => {
              onClose();
            }, 300);
          }
        }}
        type={dialogType}
      />

      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePreview}
      >
        <View style={styles.previewOverlay}>
          <View style={[styles.previewContainer, { backgroundColor: theme.background }]}> 
            <UserProfileInfo
              user={{
                ...user,
                name,
                email,
                description,
                urlProfilePhoto: image,
              }}
              locationName={locationName}
              loadingLocation={loadingLocation}
            />
            <View style={styles.previewButtons}>
              <Button
                title="Confirm Changes"
                onPress={() => {
                  closePreview();
                  handleSave();
                }}
                variant="primary"
              />
              <Button
                title="Back to Edit"
                onPress={closePreview}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        {user && authToken && (
          <SetLocationForm
            userId={user.uuid}
            token={authToken}
            onClose={() => setShowLocationModal(false)}
          />
        )}
      </Modal>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  title: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  pickButton: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  pickButtonText: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    fontSize: fonts.size.md,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: '90%',
    padding: spacing.lg,
    borderRadius: 12,
  },
  previewButtons: {
    marginTop: spacing.lg,
  },
  locationRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: fonts.size.md,
    marginRight: spacing.sm,
  },
  updateLocationButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
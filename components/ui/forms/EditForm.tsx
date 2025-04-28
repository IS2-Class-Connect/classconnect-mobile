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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { uploadImageAsync } from '../../../firebase/upload';
import { updateUserProfile } from '../../../services/userApi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { getAuth, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';
import UserProfileInfo from '../cards/UserProfileCard';
import SetLocationForm from './SetLocationForm'; // 


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

  // Form state
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [email, setEmail] = useState(initialEmail);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [image, setImage] = useState<string | null>(initialProfilePhoto);
  const [uploading, setUploading] = useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');

  // Preview modal state
  const [previewVisible, setPreviewVisible] = useState(false);

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Reset form fields if initial props change
  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
    setEmail(initialEmail);
    setImage(initialProfilePhoto);
  }, [initialName, initialDescription, initialEmail, initialProfilePhoto]);

  // Show dialog message
  const showDialog = (message: string, type: 'success' | 'error') => {
    setDialogMessage(message);
    setDialogType(type);
    setDialogVisible(true);
  };

  // Open profile preview modal
  const openPreview = () => setPreviewVisible(true);

  // Close profile preview modal
  const closePreview = () => setPreviewVisible(false);

  // Handle picking a new profile photo
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

  // Handle saving profile changes (except location)
  const handleSave = async () => {
    console.log('🔵 Starting handleSave');

    if (!name.trim() || !email.trim()) {
      showDialog('Name and email cannot be empty.', 'error');
      return;
    }

    if (!user || !authToken) {
      showDialog('User not authenticated.', 'error');
      return;
    }

    setUploading(true);

    try {
      const auth = getAuth();

      // If email has changed, reauthenticate user
      if (email !== initialEmail) {
        if (!confirmPassword.trim()) {
          showDialog('Please enter your password to change email.', 'error');
          setUploading(false);
          return;
        }
        try {
          console.log('🔒 Reauthenticating...');
          const credential = EmailAuthProvider.credential(auth.currentUser!.email!, confirmPassword);
          await reauthenticateWithCredential(auth.currentUser!, credential);
          console.log('✅ Reauthenticated.');

          console.log('✏️ Updating Firebase email...');
          await updateEmail(auth.currentUser!, email);
          console.log('✅ Firebase email updated.');
        } catch (error) {
          console.log('❌ Reauthentication or email update error:', error);
          if (error instanceof FirebaseError) {
            switch (error.code) {
              case 'auth/wrong-password':
                showDialog('Incorrect password.', 'error');
                break;
              case 'auth/email-already-in-use':
                showDialog('This email is already in use.', 'error');
                break;
              case 'auth/requires-recent-login':
                showDialog('You need to log in again to change your email.', 'error');
                break;
              default:
                showDialog('Failed to change email.', 'error');
            }
          } else {
            showDialog('Unknown error updating email.', 'error');
          }
          setUploading(false);
          return;
        }
      }

      // Upload new profile photo if changed
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

      // Update user profile on backend
      try {
        console.log('🧾 Updating backend user profile...');
        await updateUserProfile(
          user.uuid,
          { name, email, urlProfilePhoto: newProfilePhotoUrl, description },
          authToken,
        );
        console.log('✅ Backend user profile updated.');
      } catch (backendError) {
        console.log('❌ Backend update error:', backendError);
        showDialog('Failed to update backend user profile.', 'error');
        setUploading(false);
        return;
      }

      // Refresh user data locally
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
      {/* Main form */}
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

          {/* Confirm password field only if email was changed */}
          {email !== initialEmail && (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Confirm your password to update your email.
              </Text>
            </>
          )}

          <TextInput
            style={[styles.input, styles.bioInput, { backgroundColor: theme.surface, color: theme.text }]}
            placeholder="Biography"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
          />
           <Button
            title="Update Location"
            onPress={() => setShowLocationModal(true)}
            disabled={uploading}
            variant="primary"
          />
          {/* Buttons */}
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

      {/* Dialog for errors or success */}
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

      {/* Modal for previewing updated profile */}
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
              locationName="Preview Location"
              loadingLocation={false}
              
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

      {/* Modal for setting/updating location */}
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
            onClose={() => {
              setShowLocationModal(false);
            }}
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
  infoText: {
    fontSize: fonts.size.sm,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
    textAlign: 'center',
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
});

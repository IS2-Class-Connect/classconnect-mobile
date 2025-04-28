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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { uploadImageAsync } from '../../../firebase/upload';
import { updateUserProfile } from '../../../services/userApi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { getAuth, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Button from '../buttons/Button';
import Dialog from '../alerts/Dialog';

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
  const [confirmPassword, setConfirmPassword] = useState(''); // ✨ NEW
  const [image, setImage] = useState<string | null>(initialProfilePhoto);
  const [uploading, setUploading] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
    setEmail(initialEmail);
    setImage(initialProfilePhoto);
  }, [initialName, initialDescription, initialEmail, initialProfilePhoto]);

  const showDialog = (message: string, type: 'success' | 'error') => {
    setDialogMessage(message);
    setDialogType(type);
    setDialogVisible(true);
  };

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

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      showDialog('Name and email cannot be empty.', 'error');
      return;
    }

    if (!user || !authToken) {
      showDialog('User not authenticated.', 'error');
      return;
    }

    try {
      setUploading(true);

      const auth = getAuth();

      // ⚡ 1. If email changed, reauthenticate first
      if (email !== initialEmail) {
        if (!confirmPassword.trim()) {
          showDialog('Please enter your password to change email.', 'error');
          setUploading(false);
          return;
        }
        try {
          console.log('🔒 Reauthenticating user...');
          const credential = EmailAuthProvider.credential(auth.currentUser!.email!, confirmPassword);
          await reauthenticateWithCredential(auth.currentUser!, credential);
          console.log('✅ Reauthenticated.');

          console.log('✏️ Updating Firebase email...');
          await updateEmail(auth.currentUser!, email);
          console.log('✅ Firebase email updated.');
        } catch (reauthError) {
          console.log('❌ Error during reauthentication or email update:', reauthError);
          showDialog('Incorrect password or unable to change email.', 'error');
          setUploading(false);
          return;
        }
      }

      // 📷 2. Upload profile photo if changed
      let newProfilePhotoUrl = initialProfilePhoto;

      if (image && image !== initialProfilePhoto) {
        try {
          newProfilePhotoUrl = await uploadImageAsync(image, `users/${user.uuid}/profilePhoto.jpg`);
          console.log('✅ Profile photo uploaded.');
        } catch (uploadError) {
          console.log('❌ Error uploading image:', uploadError);
          showDialog('Failed to upload profile photo.', 'error');
          setUploading(false);
          return;
        }
      }

      // 🧾 3. Update backend
      try {
        await updateUserProfile(
          user.uuid,
          {
            name,
            email,
            urlProfilePhoto: newProfilePhotoUrl,
            description,
          },
          authToken,
        );
      } catch (updateError) {
        console.log('❌ Error updating profile:', updateError);
        showDialog('Failed to update user profile.', 'error');
        setUploading(false);
        return;
      }

      console.log('✅ Profile updated successfully.');
      await refreshUserData();
      showDialog('Profile updated successfully!', 'success');
      onClose();
    } catch (error) {
      console.log('❌ Unexpected error:', error);
      showDialog('An unexpected error occurred.', 'error');
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
          {/* ✨ Confirm password only if email changed */}
          {email !== initialEmail && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
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
            title={uploading ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            disabled={uploading}
            variant="primary"
          />
          <Button
            title="Cancel"
            onPress={onClose}
            variant="primary"
            disabled={uploading}
          />
        </View>
      </TouchableWithoutFeedback>

      <Dialog
        visible={dialogVisible}
        message={dialogMessage}
        onClose={() => setDialogVisible(false)}
        type={dialogType}
      />
    </>
  );
}

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
});

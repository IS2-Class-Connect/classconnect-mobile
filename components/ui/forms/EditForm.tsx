import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { uploadImageAsync } from '../../../firebase/upload';
import { updateUserProfile } from '../../../services/userApi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Button from '../buttons/Button';

interface EditFormProps {
  initialName: string;
  initialDescription: string;
  initialProfilePhoto: string;
  initialEmail: string;
  onClose: () => void;
}

export default function EditForm({ initialName, initialDescription, initialProfilePhoto, initialEmail, onClose }: EditFormProps) {
  const theme = useTheme();
  const { user, authToken, refreshUserData } = useAuth(); // ✅ también sacamos authToken ahora
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [email, setEmail] = useState(initialEmail);
  const [image, setImage] = useState<string | null>(initialProfilePhoto);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email cannot be empty.');
      return;
    }

    if (!user || !authToken) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      setUploading(true);

      let newProfilePhotoUrl = initialProfilePhoto;

      if (image && image !== initialProfilePhoto) {
        try {
          newProfilePhotoUrl = await uploadImageAsync(image, `users/${user.uuid}/profilePhoto.jpg`);
        } catch (uploadError) {
          console.log('❌ Error uploading image:', uploadError);
          Alert.alert('Error', 'Failed to upload profile photo.');
          setUploading(false);
          return;
        }
      }

      try {
        await updateUserProfile(user.uuid, {
          name,
          email,
          urlProfilePhoto: newProfilePhotoUrl,
          description,
        }, authToken); // 
      } catch (updateError) {
        console.log('❌ Error updating profile:', updateError);
        Alert.alert('Error', 'Failed to update user profile.');
        setUploading(false);
        return;
      }

      console.log('✅ Profile updated successfully');
      await refreshUserData();
      Alert.alert('Success', 'Profile updated!');
      onClose();
    } catch (error) {
      console.log('❌ Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  return (
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

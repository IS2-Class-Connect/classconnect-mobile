import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { uploadMediaAsync } from '../../../firebase/upload';
import * as ImagePicker from 'expo-image-picker';
import { addResource, ModuleResource } from '../../../services/modulesApi';

interface Props {
  visible: boolean;
  moduleId: string;
  courseId: number;
  onClose: () => void;
  onAdded: (resource: ModuleResource) => void;
  existingResources: ModuleResource[];
}

export default function ResourceModal({
  visible,
  onClose,
  moduleId,
  courseId,
  onAdded,
  existingResources,
}: Props) {
  const theme = useTheme();
  const { user, authToken } = useAuth();
  const [link, setLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);

  const maxOrder = existingResources.length > 0 ? Math.max(...existingResources.map(r => r.order)) : 0;

  useEffect(() => {
    if (!visible) {
      setLink('');
      setShowLinkInput(false);
      setUploading(false);
    }
  }, [visible]);

  const handleUpload = async (type: 'image' | 'video') => {
    if (!user || !authToken) {
      Alert.alert('User not authenticated');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUploading(true);
      try {
        const uri = result.assets[0].uri;
        const url = await uploadMediaAsync(uri, `modules/${moduleId}/${Date.now()}`);

        const dataType = type === 'image' ? 'IMAGE' : 'VIDEO';

        const resource = await addResource(
          moduleId,
          courseId,
          {
            link: url,
            dataType,
            order: maxOrder + 10,
          },
          authToken,
          user.uuid
        );

        onAdded(resource);
        onClose();
      } catch (error) {
        //console.error(error);
        Alert.alert('Error', 'Something went wrong while uploading the media.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAddLink = async () => {
    if (!link.trim() || !user || !authToken) return;

    if (!/^https?:\/\/\S+$/.test(link)) {
      Alert.alert('Invalid link');
      return;
    }

    setUploading(true);
    try {
      const resource = await addResource(
        moduleId,
        courseId,
        {
          link,
          dataType: 'LINK',
          order: maxOrder + 10,
        },
        authToken,
        user.uuid
      );
      onAdded(resource);
      onClose();
    } catch (error) {
      //console.error(error);
      Alert.alert('Error', 'Failed to add the link.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Add Resource</Text>

          <TouchableOpacity
            style={[styles.optionBox, { borderColor: theme.primary }]}
            onPress={() => handleUpload('image')}
            disabled={uploading}
          >
            <Text style={[styles.optionText, { color: theme.primary }]}>Upload Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionBox, { borderColor: theme.primary }]}
            onPress={() => handleUpload('video')}
            disabled={uploading}
          >
            <Text style={[styles.optionText, { color: theme.primary }]}>Upload Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionBox, { borderColor: theme.primary }]}
            onPress={() => setShowLinkInput(!showLinkInput)}
            disabled={uploading}
          >
            <Text style={[styles.optionText, { color: theme.primary }]}>Paste a Link</Text>
          </TouchableOpacity>

          {showLinkInput && (
            <>
              <TextInput
                placeholder="Enter link"
                placeholderTextColor="#999"
                style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
                value={link}
                onChangeText={setLink}
              />
              <TouchableOpacity onPress={handleAddLink} disabled={uploading || !link.trim()}>
                <Text style={[styles.confirmButton, { color: theme.success }]}>Add</Text>
              </TouchableOpacity>
            </>
          )}

          {uploading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>Uploading...</Text>
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={styles.cancelContainer} disabled={uploading}>
            <Text style={[styles.cancelText, { color: theme.error }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    borderRadius: 12,
    padding: spacing.lg,
  },
  title: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  optionBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  optionText: {
    fontSize: fonts.size.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  confirmButton: {
    fontSize: fonts.size.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loadingText: {
    fontSize: fonts.size.sm,
    marginLeft: spacing.sm,
  },
  cancelContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fonts.size.md,
  },
});

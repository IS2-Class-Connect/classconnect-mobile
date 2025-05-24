import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, Alert } from 'react-native';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';
import { uploadMediaAsync } from '../../../firebase/upload';
import * as ImagePicker from 'expo-image-picker';
import { addResource, ModuleResource } from '../../../services/modulesMockApi';

interface Props {
  visible: boolean;
  moduleId: string;
  onClose: () => void;
  onAdded: (resource: ModuleResource) => void;
  existingResources: ModuleResource[];
}

export default function ResourceModal({ visible, onClose, moduleId, onAdded, existingResources }: Props) {
  const theme = useTheme();
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);

  const maxOrder = existingResources.length > 0 ? Math.max(...existingResources.map(r => r.order)) : 0;

  const handleUpload = async (type: 'image' | 'video') => {
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
        const resource = addResource(moduleId, {
          link: url,
          data_type: type,
          order: maxOrder + 10,
        });
        if (resource) onAdded(resource);
        onClose();
      } catch (error) {
        Alert.alert('Upload failed');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAddLink = () => {
    if (!link.trim()) return;
    const resource = addResource(moduleId, {
      link,
      data_type: 'link',
      order: maxOrder + 10,
    });
    if (resource) onAdded(resource);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Add Resource</Text>

          <TouchableOpacity onPress={() => handleUpload('image')}>
            <Text style={[styles.button, { color: theme.primary }]}>Upload Image</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleUpload('video')}>
            <Text style={[styles.button, { color: theme.primary }]}>Upload Video</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Or paste a link"
            placeholderTextColor="#999"
            style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
            value={link}
            onChangeText={setLink}
          />

          <View style={styles.row}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.button, { color: theme.error }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddLink}>
              <Text style={[styles.button, { color: theme.success }]}>Add</Text>
            </TouchableOpacity>
          </View>
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
  button: {
    fontSize: fonts.size.md,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

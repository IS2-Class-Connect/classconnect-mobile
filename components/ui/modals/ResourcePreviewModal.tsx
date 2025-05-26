import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { ModuleResource } from '../../../services/modulesMockApi';
import { spacing } from '../../../constants/spacing';
import { useTheme } from '../../../context/ThemeContext';

interface Props {
  visible: boolean;
  resource: ModuleResource | null;
  onClose: () => void;
}

export default function ResourcePreviewModal({ visible, resource, onClose }: Props) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  if (!resource) return null;

  const videoPlayer = useVideoPlayer(
    resource.data_type === 'video' ? resource.link : null,
    (player) => {
      player.loop = false;
      player.play();
    }
  );

  const handleOpenLink = () => {
    Alert.alert(
      'Open External Link',
      'Are you sure you want to open this link in your browser?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', style: 'destructive', onPress: () => WebBrowser.openBrowserAsync(resource.link) },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />}

          {resource.data_type === 'image' ? (
            !loading ? (
              <Image
                source={{ uri: resource.link }}
                style={styles.preview}
                resizeMode="contain"
                onLoadEnd={() => setLoading(false)}
              />
            ) : (
              <Image
                source={{ uri: resource.link }}
                style={{ width: 0, height: 0 }}
                onLoadEnd={() => setLoading(false)}
              />
            )
          ) : resource.data_type === 'video' ? (
            !loading ? (
              <VideoView
                player={videoPlayer}
                style={styles.preview}
                allowsFullscreen
                allowsPictureInPicture
                contentFit="contain"
                nativeControls
                onFirstFrameRender={() => setLoading(false)}
              />
            ) : (
              <VideoView
                player={videoPlayer}
                style={{ width: 0, height: 0 }}
                onFirstFrameRender={() => setLoading(false)}
              />
            )
          ) : (
            <TouchableOpacity onPress={handleOpenLink} style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: theme.primary }]}>
                {resource.link}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000090',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
  width: '95%',
  maxHeight: '90%',
  minHeight: 400,
  borderRadius: 12,
  padding: spacing.lg,
  alignItems: 'center',
},
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
  preview: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  linkContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

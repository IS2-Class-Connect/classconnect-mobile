import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Text,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useTheme } from '../../../context/ThemeContext';
import { ModuleResource, patchResourceOrder } from '../../../services/modulesMockApi';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../../constants/spacing';
import ResourceModal from '../modals/ResourceModal';
import ResourcePreviewModal from '../modals/ResourcePreviewModal';

// Íconos;
const driveIcon = require('../../../assets/icons/drive.png');
const facebookIcon = require('../../../assets/icons/facebook.png');
const videoIcon = require('../../../assets/icons/video.png');
const linkIcon = require('../../../assets/icons/link-logo.png');

interface Props {
  moduleId: string;
  initialResources: ModuleResource[];
}

export default function ResourceGrid({ moduleId, initialResources }: Props) {
  const theme = useTheme();
  const [resources, setResources] = useState(
    [...initialResources].sort((a, b) => a.order - b.order)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [previewResource, setPreviewResource] = useState<ModuleResource | null>(null);

  const handleDragEnd = async ({ data }: { data: ModuleResource[] }) => {
    const needsSpacing = data.some((r, i) => i > 0 && r.order - data[i - 1].order <= 1);
    const newResources = needsSpacing
      ? data.map((r, i) => ({ ...r, order: (i + 1) * 10 }))
      : data.map((r, i) => ({ ...r, order: data[0].order + i * 10 }));

    for (const r of newResources) {
      patchResourceOrder(moduleId, r.link, r.order);
    }

    setResources(newResources);
  };

  const handleAddResource = (newRes: ModuleResource) => {
    setResources((prev) => [...prev, newRes].sort((a, b) => a.order - b.order));
  };

  const getYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  };

  const getSocialIcon = (link: string): any => {
    if (link.includes('drive.google.com')) return driveIcon;
    if (link.includes('facebook.com')) return facebookIcon;
    return null;
  };

  const handlePressResource = (resource: ModuleResource) => {
    if (resource.data_type === 'link') {
      Alert.alert(
        'Leaving the app',
        'Are you sure you want to open this link in your browser?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => Linking.openURL(resource.link) },
        ]
      );
    } else {
      setPreviewResource(resource);
    }
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ModuleResource>) => {
    const isVideo = item.data_type === 'video';
    const isImage = item.data_type === 'image';

    const youtubeId = getYoutubeId(item.link);
    const socialIcon = getSocialIcon(item.link);

    let preview;

    if (isImage) {
      preview = <Image source={{ uri: item.link }} style={styles.preview} resizeMode="cover" />;
    } else if (isVideo) {
      preview = <Image source={videoIcon} style={styles.preview} resizeMode="contain" />;
    } else if (youtubeId) {
      preview = (
        <Image
          source={{ uri: `https://img.youtube.com/vi/${youtubeId}/0.jpg` }}
          style={styles.preview}
          resizeMode="cover"
        />
      );
    } else if (socialIcon) {
      preview = <Image source={socialIcon} style={styles.preview} resizeMode="contain" />;
    } else {
      preview = <Image source={linkIcon} style={styles.preview} resizeMode="contain" />;
    }

    const label = isImage
      ? 'Image'
      : isVideo
      ? 'Video'
      : (() => {
          try {
            const { hostname } = new URL(item.link);
            return hostname.replace('www.', '');
          } catch {
            return 'Link';
          }
        })();

    return (
      <TouchableOpacity
        onPress={() => handlePressResource(item)}
        onLongPress={drag}
        disabled={isActive}
        style={[styles.item, { backgroundColor: theme.card, opacity: isActive ? 0.7 : 1 }]}
      >
        {preview}
        <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={resources}
        keyExtractor={(item) => item.link}
        numColumns={4}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.grid}
        scrollEnabled={false}
      />

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.addButton, { backgroundColor: theme.primary }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ResourceModal
        visible={modalVisible}
        moduleId={moduleId}
        onClose={() => setModalVisible(false)}
        onAdded={handleAddResource}
        existingResources={resources}
      />

      {previewResource && (
        <ResourcePreviewModal
          resource={previewResource}
          onClose={() => setPreviewResource(null)}
          visible={!!previewResource}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  grid: {
    gap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingBottom: spacing.lg,
  },
  item: {
    width: 70,
    height: 90, // Altura aumentada para incluir texto debajo
    margin: spacing.sm / 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  preview: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  addButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    alignSelf: 'center',
  },
});

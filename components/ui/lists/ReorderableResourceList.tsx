import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import {
  ModuleResource,
  patchResourceOrder,
  deleteResource,
} from '../../../services/modulesApi';
import ResourceModal from '../modals/ResourceModal';
import ResourcePreviewModal from '../modals/ResourcePreviewModal';

const driveIcon = require('../../../assets/icons/drive.png');
const facebookIcon = require('../../../assets/icons/facebook.png');
const videoIcon = require('../../../assets/icons/video.png');
const linkIcon = require('../../../assets/icons/link-logo.png');
const defaultLinkIcon = require('../../../assets/icons/default-link-blue.png');

const screenWidth = Dimensions.get('window').width;

interface Props {
  moduleId: string;
  courseId: number;
  initialResources: ModuleResource[];
  role?: 'Student' | 'Professor' | 'Assistant';
  authToken: string;
  userId: string;
  onOrderUpdate?: () => void;
}

export default function ReorderableResourceList({
  moduleId,
  courseId,
  initialResources,
  role,
  authToken,
  userId,
  onOrderUpdate,
}: Props) {
  const theme = useTheme();
  const [resources, setResources] = useState<ModuleResource[]>(
    [...initialResources].sort((a, b) => a.order - b.order)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [previewResource, setPreviewResource] = useState<ModuleResource | null>(null);

  const isAuthorized = role === 'Professor' || role === 'Assistant';

  const handleReorder = async ({ data }: { data: ModuleResource[] }) => {
    const reordered = data.map((item, index) => ({ ...item, order: (index + 1) * 10 }));
    for (const r of reordered) {
      await patchResourceOrder(moduleId, courseId, encodeURIComponent(r.link), r.order, userId, authToken);
    }
    setResources(reordered);
    if (onOrderUpdate) onOrderUpdate();
  };

  const handleDelete = (link: string) => {
    Alert.alert('Delete Resource', 'Are you sure you want to delete this resource?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteResource(moduleId, courseId, encodeURIComponent(link), userId, authToken);
          setResources((prev) => prev.filter((r) => r.link !== link));
          if (onOrderUpdate) onOrderUpdate();
        },
      },
    ]);
  };

  const handlePress = (res: ModuleResource) => {
    if (res.dataType === 'LINK') {
      Alert.alert('Leaving the app', 'Open this link in your browser?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => Linking.openURL(res.link) },
      ]);
    } else {
      setPreviewResource(res);
    }
  };

  const getYoutubeId = (url: string): string | null => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return null;
    const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([0-9A-Za-z_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const getSocialIcon = (link: string): any => {
    if (link.includes('drive.google.com')) return driveIcon;
    if (link.includes('facebook.com')) return facebookIcon;
    return null;
  };

  const handleAddResource = (newRes: ModuleResource) => {
    setResources((prev) => [...prev, newRes].sort((a, b) => a.order - b.order));
    if (onOrderUpdate) onOrderUpdate();
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ModuleResource>) => {
    const isImage = item.dataType === 'IMAGE';
    const isVideo = item.dataType === 'VIDEO';
    const youtubeId = getYoutubeId(item.link);
    const socialIcon = getSocialIcon(item.link);

    let preview;
    if (isImage) {
      preview = <Image source={{ uri: item.link }} style={styles.preview} resizeMode="cover" />;
    } else if (isVideo) {
      preview = <Image source={videoIcon} style={styles.previewIcon} resizeMode="contain" />;
    } else if (youtubeId) {
      preview = (
        <Image
          source={{ uri: `https://img.youtube.com/vi/${youtubeId}/0.jpg` }}
          style={styles.preview}
          resizeMode="cover"
        />
      );
    } else if (socialIcon) {
      preview = <Image source={socialIcon} style={styles.previewIcon} resizeMode="contain" />;
    } else {
      preview = <Image source={defaultLinkIcon} style={styles.previewIcon} resizeMode="contain" />;
    }

    if (!item.dataType) {
      console.warn('⚠️ Resource with missing dataType:', item);
    }

    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        onLongPress={isAuthorized ? drag : undefined}
        disabled={!isAuthorized && isActive}
        style={[styles.card, { backgroundColor: theme.card, opacity: isActive ? 0.7 : 1 }]}
      >
        <View style={styles.resourceTextContainer}>
          {preview}
          <Text style={[styles.resourceType, { color: theme.text }]}>
            {(item.dataType ?? 'UNKNOWN').toUpperCase()}
          </Text>
        </View>
        {isAuthorized && (
          <TouchableOpacity onPress={() => handleDelete(item.link)}>
            <Ionicons name="trash-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <DraggableFlatList
        data={resources}
        keyExtractor={(item) => item.link}
        renderItem={renderItem}
        onDragEnd={isAuthorized ? handleReorder : () => {}}
        scrollEnabled={true}
        contentContainerStyle={styles.list}
      />

      {isAuthorized && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <ResourceModal
        visible={modalVisible}
        moduleId={moduleId}
        courseId={courseId}
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
  list: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 480,
    width: '100%',
  },
  resourceTextContainer: {
    flex: 1,
    marginRight: spacing.md,
    maxWidth: '85%',
  },
  resourceType: {
    fontSize: fonts.size.xs,
    opacity: 0.6,
  },
  preview: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  previewIcon: {
    width: 28,
    height: 28,
    marginBottom: spacing.xs,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

// modules/ReorderableModuleList.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { Module, patchModule } from '../../../services/modulesMockApi';

interface Props {
  modules: Module[];
  onUpdate: (updated: Module[]) => void;
  isAuthorized: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (mod: Module) => void;
}

export default function ReorderableModuleList({
  modules,
  onUpdate,
  isAuthorized,
  onDelete,
  onEdit,
}: Props) {
  const theme = useTheme();
  const [data, setData] = useState<Module[]>([]);

  useEffect(() => {
    setData([...modules].sort((a, b) => a.order - b.order));
  }, [modules]);

  const renormalizeOrder = (items: Module[]) => {
    return items.map((item, index) => ({
      ...item,
      order: (index + 1) * 10,
    }));
  };

  const handleDragEnd = async ({ data: newData }: { data: Module[] }) => {
    if (!isAuthorized) return;

    const reordered = [...newData];

    let needsRenormalization = false;
    for (let i = 1; i < reordered.length; i++) {
      if (reordered[i].order - reordered[i - 1].order <= 1) {
        needsRenormalization = true;
        break;
      }
    }

    const updatedModules = needsRenormalization
      ? renormalizeOrder(reordered)
      : reordered.map((mod, index) => ({
          ...mod,
          order: reordered[0].order + index * 10,
        }));

    for (const mod of updatedModules) {
      console.log('Updating module whith order ', mod.order);
      patchModule(mod.id, { order: mod.order });
    }

    setData(updatedModules);
    onUpdate(updatedModules);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Module>) => {
    return (
      <TouchableOpacity
        onLongPress={isAuthorized ? drag : undefined}
        delayLongPress={150}
        activeOpacity={0.9}
        style={[styles.card, { backgroundColor: theme.card, opacity: isActive ? 0.7 : 1 }]}
      >

        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>

        {isAuthorized ? (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(item)}>
                <Ionicons name="create-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
              </TouchableOpacity>
            )}
            <Ionicons name="menu" size={20} color={theme.text} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <DraggableFlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onDragEnd={handleDragEnd}
      contentContainerStyle={styles.list}
      scrollEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    fontFamily: fonts.family.regular,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});

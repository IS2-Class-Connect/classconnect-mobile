// components/ui/UserProfileCard.tsx

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import { useTheme } from '../../../context/ThemeContext';

interface UserProfileInfoProps {
  user: any;
  locationName: string;
  loadingLocation: boolean;
  onProfilePhotoPress?: () => void;
}

export default function UserProfileInfo({
  user,
  locationName,
  loadingLocation,
  onProfilePhotoPress,
}: UserProfileInfoProps) {
  const theme = useTheme();

  // Helper to format account status
  const formatAccountStatus = () => {
    if (user?.accountLocked && user.lockUntil) {
      return `Locked until ${new Date(user.lockUntil).toLocaleDateString()}`;
    }
    return 'Active';
  };

  // Helper to format account age
  const formatAccountAge = () => {
    if (!user?.createdAt) return 'Unknown creation date';
    const createdDate = new Date(user.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Created today';
    if (diffDays === 1) return 'Created 1 day ago';
    if (diffDays < 30) return `Created ${diffDays} days ago`;
    if (diffDays < 365) return `Created ${Math.floor(diffDays / 30)} months ago`;
    return `Created ${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <View style={styles.container}>
      {/* Profile picture */}
      {user?.urlProfilePhoto && (
        <TouchableOpacity onPress={onProfilePhotoPress} activeOpacity={0.8}>
          <Image source={{ uri: user.urlProfilePhoto }} style={styles.avatar} />
        </TouchableOpacity>
      )}

      {/* Name and Email */}
      <Text style={[styles.name, { color: theme.text }]}>
        {user?.name ?? 'No Name'}
      </Text>
      <Text style={[styles.email, { color: theme.text }]}>
        {user?.email ?? 'No Email'}
      </Text>

      {/* Biography */}
      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Biography</Text>
        <Text style={[styles.info, { color: theme.text }]}>
          {user?.description || 'No biography provided.'}
        </Text>
      </View>

      {/* Account Status */}
      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Account Status</Text>
        <Text style={[styles.info, { color: theme.text }]}>
          {formatAccountStatus()}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Location</Text>
        {loadingLocation ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <Text style={[styles.info, { color: theme.text }]}>
            {locationName}
          </Text>
        )}
      </View>

      {/* Account Created */}
      <View style={styles.infoSection}>
        <Text style={[styles.label, { color: theme.text }]}>Account Created</Text>
        <Text style={[styles.info, { color: theme.text }]}>
          {formatAccountAge()}
        </Text>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: fonts.size.md,
    marginBottom: spacing.lg,
  },
  infoSection: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.size.sm,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  info: {
    fontSize: fonts.size.md,
  },
});

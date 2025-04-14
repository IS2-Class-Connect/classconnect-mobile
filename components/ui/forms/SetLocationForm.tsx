import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../constants/spacing';
import { fonts } from '../../../constants/fonts';
import Dialog from '../alerts/Dialog';
import { updateUserLocation } from '../../../services/userApi';

type Props = {
  onClose: () => void;
  userId: number;
  token: string;
};

export default function SetLocationForm({ onClose, userId, token }: Props) {
  const theme = useTheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [askingShare, setAskingShare] = useState(false);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setPermissionDenied(true);
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setAskingShare(true);
    } catch (error) {
      setErrorMsg('Failed to get location');
    }
  };

  const handleShareLocation = async () => {
    if (!location) return;
    try {
      await updateUserLocation(userId, location.coords.latitude, location.coords.longitude, token);
      console.log('📍 Location updated in backend successfully');
      onClose();
    } catch (err) {
      setErrorMsg('Failed to send location to backend');
    }
  };
  

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Your location</Text>

      {permissionDenied && (
        <Text style={[styles.warning, { color: theme.warning }]}>
          Allowing location helps us personalize your experience.
        </Text>
      )}

      {location ? (
        <>
          <MapView
            style={styles.map}
            region={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
            />
          </MapView>

          <Text style={{ color: theme.text, marginTop: spacing.md, textAlign: 'center' }}>
            Sharing your location allows us to offer a more personalized experience.
          </Text>

          {askingShare && (
            <View style={styles.buttons}>
              <Button title="Yes, share location" onPress={handleShareLocation} />
              <Button title="No, continue without sharing" onPress={onClose} />
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={{ color: theme.text }}>Getting location...</Text>
          <View style={styles.buttons}>
            <Button title="Retry" onPress={requestLocation} />
            <Button title="Continue without location" onPress={onClose} />
          </View>
        </>
      )}

      <Dialog
        visible={!!errorMsg && !permissionDenied}
        message={errorMsg || ''}
        onClose={() => setErrorMsg(null)}
        type="error"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  warning: {
    marginVertical: spacing.sm,
    fontSize: fonts.size.md,
    textAlign: 'center',
  },
  buttons: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  map: {
    width: Dimensions.get('window').width - spacing.lg * 2,
    height: 300,
    borderRadius: 8,
    marginTop: spacing.md,
  },
});

import * as Notifications from 'expo-notifications';
import { patchToGateway } from '@/services/gatewayClient';

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  return (await Notifications.getExpoPushTokenAsync()).data;
}

export async function updateUserPushToken(userId: string, pushToken: string, token: string) {
  const endpoint = `/users/${userId}/push-token`;
  const data = { pushToken: pushToken };
  return patchToGateway(endpoint, data, token);
}

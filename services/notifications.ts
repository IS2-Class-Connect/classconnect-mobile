import * as Notifications from 'expo-notifications';
import { patchToGateway, postToGateway } from '@/services/gatewayClient';

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push notification token. Please check your notification permissions and try again.');
    return;
  }

  return (await Notifications.getExpoPushTokenAsync()).data;
}

export async function updateUserPushToken(uuid: string, pushToken: string, token: string) {
  const endpoint = `/users/${uuid}/push-token`;
  const data = { pushToken };
  return patchToGateway(endpoint, data, token);
}

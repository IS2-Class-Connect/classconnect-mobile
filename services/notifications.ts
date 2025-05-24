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
    alert('Faled to get pus token for push notification!');
    return;
  }

  return (await Notifications.getExpoPushTokenAsync()).data;
}

export async function updateUserPushToken(uuid: string, pushToken: string, token: string) {
  const endpoint = `/users/${uuid}/push-token`;
  const data = { pushToken: pushToken };
  return patchToGateway(endpoint, data, token);
}

export async function sendNotification(uuid: string, title: string, body: string) {
  const endpoint = '/notifications';
  const data = { uuid, title, body };
  return postToGateway(endpoint, data, 'gateway-token');
}



import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { request } from './api';
import type { PushStatus } from './push';

let destination: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function registerPush(prompt: boolean): Promise<PushStatus> {
  if (Platform.OS !== 'android') return 'unsupported';
  try {
    await Notifications.setNotificationChannelAsync('rides', { name: 'Ride updates', importance: Notifications.AndroidImportance.HIGH });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && prompt && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return permission.canAskAgain ? 'prompt' : 'denied';
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return 'error';
    destination = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await request('/push/subscriptions', { platform: 'expo', token: destination });
    return 'registered';
  } catch { return 'error'; }
}

export async function getPushDestination(): Promise<string | null> {
  return destination;
}

export function listenForPush(onOpen: () => void, onReceive: () => void): () => void {
  const received = Notifications.addNotificationReceivedListener(onReceive);
  const opened = Notifications.addNotificationResponseReceivedListener(onOpen);
  void Notifications.getLastNotificationResponseAsync().then((response) => { if (response) onOpen(); }).catch(() => {});
  return () => { received.remove(); opened.remove(); };
}

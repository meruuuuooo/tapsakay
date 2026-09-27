import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';
import { request } from './api';
import type { PushStatus } from './push';

let destination: string | null = null;
let notifications: typeof ExpoNotifications | null = null;

function getNotifications(): typeof ExpoNotifications | null {
  if (isRunningInExpoGo()) return null;
  if (!notifications) {
    notifications = require('expo-notifications') as typeof ExpoNotifications;
    notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
  }
  return notifications;
}

export async function registerPush(prompt: boolean): Promise<PushStatus> {
  if (Platform.OS !== 'android') return 'unsupported';
  try {
    const Notifications = getNotifications();
    if (!Notifications) return 'unsupported';
    await Notifications.setNotificationChannelAsync('rides', { name: 'Ride updates', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
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
  const Notifications = getNotifications();
  if (!Notifications) return () => {};
  const received = Notifications.addNotificationReceivedListener(onReceive);
  const opened = Notifications.addNotificationResponseReceivedListener(onOpen);
  void Notifications.getLastNotificationResponseAsync().then((response) => { if (response) onOpen(); }).catch(() => {});
  return () => { received.remove(); opened.remove(); };
}

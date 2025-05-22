import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(pushToken: string, message: string): Promise<void> {
  const notification = {
    to: pushToken,
    sound: 'default',
    title: 'Cooking Event Reminder',
    body: message,
    data: { message }
  };

  const chunks = expo.chunkPushNotifications([notification]);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
} 
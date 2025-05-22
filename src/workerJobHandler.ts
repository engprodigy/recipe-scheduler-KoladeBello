import { Expo } from 'expo-server-sdk';
import { AppDataSource } from './config/database';
import { Device } from './entities/Device';
import { ReminderJob } from './services/QueueService';

export async function sendPushNotification(userId: string, title: string, eventTime: Date) {
  const deviceRepository = AppDataSource.getRepository(Device);
  const devices = await deviceRepository.find({ where: { userId } });

  if (devices.length === 0) {
    console.log(`No devices found for user ${userId}`);
    return;
  }

  const expo = new Expo();
  const message = {
    to: devices.map(device => device.pushToken),
    sound: 'default',
    title: 'Cooking Event Reminder',
    body: `${title} starts at ${eventTime.toLocaleTimeString()}`,
    data: { title, eventTime: eventTime.toISOString() },
  };

  const chunks = expo.chunkPushNotifications([message]);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}

export const reminderJobHandler = async (job: { data: ReminderJob }) => {
  const { userId, title, eventTime } = job.data;
  await sendPushNotification(userId, title, new Date(eventTime));
}; 
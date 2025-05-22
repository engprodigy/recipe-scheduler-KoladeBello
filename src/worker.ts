import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Expo } from 'expo-server-sdk';
import { AppDataSource } from './config/database';
import { Device } from './entities/Device';
import { ReminderJob } from './services/QueueService';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});
const expo = new Expo();

async function sendPushNotification(userId: string, title: string, eventTime: Date) {
  try {
    // Get all devices for the user
    const deviceRepository = AppDataSource.getRepository(Device);
    const devices = await deviceRepository.find({ where: { userId } });

    if (devices.length === 0) {
      console.log(`No devices found for user ${userId}`);
      return;
    }

    // Create the message
    const message = {
      to: devices.map(device => device.pushToken),
      sound: 'default',
      title: 'Cooking Event Reminder',
      body: `${title} starts at ${eventTime.toLocaleTimeString()}`,
      data: { title, eventTime: eventTime.toISOString() },
    };

    // Send the message
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    console.log('Push notification sent:', {
      userId,
      title,
      eventTime,
      tickets,
    });
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
}

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');

    // Create worker
    const worker = new Worker(
      'reminders',
      async (job) => {
        const { userId, title, eventTime } = job.data as ReminderJob;
        await sendPushNotification(userId, title, new Date(eventTime));
      },
      { connection }
    );

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      console.error(`Job ${job?.id} failed:`, error);
    });

    console.log('Worker started');
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 
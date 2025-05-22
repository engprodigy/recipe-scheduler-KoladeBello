import { Job } from 'bullmq';
import { ReminderJob } from './types/ReminderJob';
import { Device } from './entities/Device';
import { AppDataSource } from './config/database';
import { sendPushNotification } from './services/NotificationService';

export async function reminderJobHandler(job: Job<ReminderJob>): Promise<void> {
  try {
    const { userId, title } = job.data;
    console.warn('Processing reminder for:', title);

    const deviceRepository = AppDataSource.getRepository(Device);
    const devices = await deviceRepository.find({ where: { userId } });

    if (devices.length === 0) {
      console.warn('No devices found for user:', userId);
      return;
    }

    const message = `Reminder: ${title} starts in ${process.env.REMINDER_LEAD_MINUTES || 30} minutes`;

    for (const device of devices) {
      try {
        await sendPushNotification(device.pushToken, message);
        console.warn('Notification sent to device:', device.pushToken);
      } catch (error) {
        console.warn('Failed to send notification to device:', device.pushToken, error);
      }
    }
  } catch (error) {
    console.warn('Error processing reminder job:', error);
    throw error;
  }
} 
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

export const reminderQueue = new Queue('reminders', { connection });

export interface ReminderJob {
  userId: string;
  title: string;
  eventTime: Date;
}

export class QueueService {
  static async scheduleReminder(job: ReminderJob) {
    const leadMinutes = parseInt(process.env.REMINDER_LEAD_MINUTES || '30', 10);
    const reminderTime = new Date(job.eventTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - leadMinutes);

    // If the reminder time is in the past, don't schedule
    if (reminderTime <= new Date()) {
      console.log('Reminder time is in the past, skipping job');
      return;
    }

    const delay = reminderTime.getTime() - Date.now();

    await reminderQueue.add('reminder', job, {
      delay,
      jobId: `reminder-${job.userId}-${job.eventTime.toISOString()}`,
    });

    console.log(`Scheduled reminder for ${job.title} at ${reminderTime.toISOString()}`);
  }
} 
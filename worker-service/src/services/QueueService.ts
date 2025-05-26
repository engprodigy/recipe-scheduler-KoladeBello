import { Queue } from 'bullmq';
import { ReminderJob } from '../types/ReminderJob';
import IORedis from 'ioredis';

// Create Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const reminderQueue = new Queue<ReminderJob>('reminder-queue', { connection });

export class QueueService {
  private static instance: QueueService;
  private reminderQueue: Queue<ReminderJob>;

  private constructor() {
    this.reminderQueue = reminderQueue;
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async scheduleReminder(job: ReminderJob): Promise<void> {
    const reminderTime = new Date(job.eventTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - (parseInt(process.env.REMINDER_LEAD_MINUTES || '30')));

    if (reminderTime <= new Date()) {
      console.warn('Reminder time is in the past, skipping job:', job);
      return;
    }

    await this.reminderQueue.add('reminder', job, {
      delay: reminderTime.getTime() - Date.now()
    });
    console.warn('Scheduled reminder for:', reminderTime);
  }
} 
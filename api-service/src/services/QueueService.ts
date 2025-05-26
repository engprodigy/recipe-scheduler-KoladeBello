import axios from 'axios';
import { AppDataSource } from '../config/database';
import { Device } from '../entities/Device';

interface ReminderJob {
  userId: string;
  title: string;
  eventTime: Date;
}

export class QueueService {
  private static instance: QueueService;
  private workerServiceUrl: string;
  private deviceRepository = AppDataSource.getRepository(Device);

  private constructor() {
    this.workerServiceUrl = process.env.WORKER_SERVICE_URL || 'http://localhost:3001';
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async scheduleReminder(job: ReminderJob): Promise<void> {
    try {
      // Get the device for the user
      const device = await this.deviceRepository.findOne({ 
        where: { userId: job.userId }
      });

      if (!device) {
        console.warn('No device found for user:', job.userId);
        return;
      }

      // Ensure the event time is at least 5 minutes in the future
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
      
      if (job.eventTime < fiveMinutesFromNow) {
        throw new Error('Event time must be at least 5 minutes in the future');
      }

      await axios.post(`${this.workerServiceUrl}/api/schedule-reminder`, {
        userId: job.userId,
        title: job.title,
        eventTime: job.eventTime.toISOString(),
        deviceId: device.id,
        pushToken: device.pushToken
      });
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      throw error;
    }
  }
} 
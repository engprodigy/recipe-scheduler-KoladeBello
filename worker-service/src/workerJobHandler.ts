import { Job } from 'bullmq';
import { ReminderJob } from './types/ReminderJob';
import { NotificationService } from './services/NotificationService';

export async function reminderJobHandler(job: Job<ReminderJob>): Promise<void> {
  const { title, pushToken } = job.data;
  
  await NotificationService.getInstance().sendNotification({
    pushToken,
    title: 'Reminder',
    body: `Your event "${title}" is starting soon!`,
    data: { eventId: job.data.eventId }
  });
} 
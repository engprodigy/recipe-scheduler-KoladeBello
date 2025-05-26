import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { ReminderJob } from '../types/ReminderJob';

export class ReminderController {
  private reminderQueue: Queue<ReminderJob>;

  constructor(reminderQueue: Queue<ReminderJob>) {
    this.reminderQueue = reminderQueue;
  }

  public scheduleReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, eventTime, deviceId, pushToken } = req.body;
      
      // Convert eventTime to Date and validate
      const eventDate = new Date(eventTime);
      const now = new Date();
      
      // Add 5 minutes buffer to account for timezone differences and processing time
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
      
      if (eventDate < fiveMinutesFromNow) {
        res.status(400).json({ error: 'Reminder time must be at least 5 minutes in the future' });
        return;
      }

      const reminderJob: ReminderJob = {
        eventId: uuidv4(),
        eventTime: eventTime,
        title,
        deviceId,
        pushToken
      };

      await this.reminderQueue.add('reminder', reminderJob, {
        delay: eventDate.getTime() - now.getTime()
      });

      res.json({ message: 'Reminder scheduled successfully' });
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      res.status(500).json({ error: 'Failed to schedule reminder' });
    }
  };
} 
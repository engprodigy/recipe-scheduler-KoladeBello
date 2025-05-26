import { Router } from 'express';
import { Queue } from 'bullmq';
import { ReminderController } from '../controllers/ReminderController';
import { ReminderJob } from '../types/ReminderJob';

const router = Router();

export const createReminderRoutes = (reminderQueue: Queue<ReminderJob>) => {
  const reminderController = new ReminderController(reminderQueue);

  // Reminder routes
  router.post('/schedule-reminder', (req, res) => reminderController.scheduleReminder(req, res));

  return router;
}; 
import { Worker } from 'bullmq';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { reminderJobHandler } from './workerJobHandler';
import { ReminderJob } from './types/ReminderJob';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { createReminderRoutes } from './routes/reminderRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database connection
import { AppDataSource } from './config/database';
AppDataSource.initialize()
  .then(() => {
    console.warn('Database connected successfully');

    // Create Redis connection
    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    // Create queue and worker
    const reminderQueue = new Queue<ReminderJob>('reminder-queue', { connection });
    const worker = new Worker<ReminderJob>('reminder-queue', reminderJobHandler, {
      connection
    });

    // Register routes
    app.use('/api', createReminderRoutes(reminderQueue));

    worker.on('completed', (job) => {
      console.warn('Job completed:', job.id);
    });

    worker.on('failed', (job, error) => {
      console.warn('Job failed:', job?.id, error);
    });

    worker.on('error', (error) => {
      console.warn('Worker error:', error);
    });

    const PORT = process.env.WORKER_PORT || 3001;
    app.listen(PORT, () => {
      console.warn(`Worker service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 
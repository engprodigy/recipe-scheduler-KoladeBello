import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { reminderJobHandler } from './workerJobHandler';
import { ReminderJob } from './types/ReminderJob';
import IORedis from 'ioredis';

dotenv.config();

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

    // Create worker
    const worker = new Worker<ReminderJob>('reminder-queue', reminderJobHandler, {
      connection
    });

    worker.on('completed', (job) => {
      console.warn('Job completed:', job.id);
    });

    worker.on('failed', (job, error) => {
      console.warn('Job failed:', job?.id, error);
    });

    worker.on('error', (error) => {
      console.warn('Worker error:', error);
    });

    console.warn('Worker started');
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 
import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import { reminderJobHandler } from './workerJobHandler';
import { ReminderJob } from './types/ReminderJob';

dotenv.config();

// Initialize database connection
import { AppDataSource } from './config/database';
AppDataSource.initialize()
  .then(() => {
    console.warn('Database connected successfully');

    // Create worker
    const worker = new Worker<ReminderJob>('reminder-queue', reminderJobHandler, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
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
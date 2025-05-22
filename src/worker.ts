import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { reminderJobHandler } from './workerJobHandler';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Initialize database connection
import { AppDataSource } from './config/database';
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');

    // Create worker
    const worker = new Worker(
      'reminders',
      reminderJobHandler,
      { connection }
    );

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      console.error(`Job ${job?.id} failed:`, error);
    });

    console.log('Worker started');
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 
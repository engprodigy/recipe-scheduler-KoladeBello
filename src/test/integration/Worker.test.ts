import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { AppDataSource } from '../../config/database';
import { Device } from '../../entities/Device';
import { sendPushNotification, reminderJobHandler } from '../../workerJobHandler';

// Mock Expo
const mockChunkPushNotifications = jest.fn().mockReturnValue([[]]);
const mockSendPushNotificationsAsync = jest.fn().mockResolvedValue([]);

jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    chunkPushNotifications: mockChunkPushNotifications,
    sendPushNotificationsAsync: mockSendPushNotificationsAsync,
  })),
}));

describe('Worker Integration', () => {
  let worker: Worker;
  let queue: Queue;
  let redis: IORedis;

  beforeAll(async () => {
    redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    queue = new Queue('reminders', { connection: redis });
    
    worker = new Worker(
      'reminders',
      reminderJobHandler,
      { connection: redis }
    );

    // Wait for worker to be ready
    await worker.waitUntilReady();
  });

  beforeEach(async () => {
    await AppDataSource.getRepository(Device).clear();
    jest.clearAllMocks();
    mockChunkPushNotifications.mockClear();
    mockSendPushNotificationsAsync.mockClear();
  });

  afterAll(async () => {
    await worker.close();
    await queue.close();
    await redis.quit();
  });

  it('should process a reminder job and send notification', async () => {
    // Create a test device
    const device = new Device();
    device.userId = 'user123';
    device.pushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    await AppDataSource.getRepository(Device).save(device);

    // Create a test job
    const jobData = {
      userId: 'user123',
      title: 'Test Cooking Event',
      eventTime: new Date().toISOString(),
    };

    // Add the job to the queue
    const job = await queue.add('reminder', jobData);

    // Wait for job to complete with a timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Job processing timed out'));
      }, 10000);

      worker.on('completed', (completedJob) => {
        if (completedJob.id === job.id) {
          clearTimeout(timeout);
          resolve();
        }
      });

      worker.on('failed', (failedJob, error) => {
        if (failedJob?.id === job.id) {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });

    // Verify Expo was called
    expect(mockChunkPushNotifications).toHaveBeenCalled();
    expect(mockSendPushNotificationsAsync).toHaveBeenCalled();
  }, 15000); // Increase test timeout to 15 seconds

  it('should handle missing devices gracefully', async () => {
    const jobData = {
      userId: 'nonexistent-user',
      title: 'Test Cooking Event',
      eventTime: new Date().toISOString(),
    };

    // Add the job to the queue
    const job = await queue.add('reminder', jobData);

    // Wait for job to complete with a timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Job processing timed out'));
      }, 10000);

      worker.on('completed', (completedJob) => {
        if (completedJob.id === job.id) {
          clearTimeout(timeout);
          resolve();
        }
      });

      worker.on('failed', (failedJob, error) => {
        if (failedJob?.id === job.id) {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });

    // Verify Expo was not called
    expect(mockChunkPushNotifications).not.toHaveBeenCalled();
    expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled();
  }, 15000); // Increase test timeout to 15 seconds
}); 
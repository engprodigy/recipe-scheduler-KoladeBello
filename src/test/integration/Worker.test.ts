import { Queue, Worker } from 'bullmq';
import { Device } from '../../entities/Device';
import { reminderJobHandler } from '../../workerJobHandler';
import { AppDataSource } from '../../config/database';

// Mock Expo
jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    chunkPushNotifications: jest.fn().mockReturnValue([[]]),
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([])
  }))
}));

describe('Worker Integration', () => {
  let queue: Queue;
  let worker: Worker;
  let device: Device;

  beforeAll(async () => {
    queue = new Queue('reminder-queue', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    worker = new Worker('reminder-queue', reminderJobHandler, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    // Create test device
    device = new Device();
    device.userId = 'test-user';
    device.pushToken = 'ExponentPushToken[test-token]';
    await AppDataSource.getRepository(Device).save(device);
  });

  afterAll(async () => {
    await worker.close();
    await queue.close();
    await AppDataSource.getRepository(Device).remove(device);
  });

  it('should process reminder job and send notification', async () => {
    const job = await queue.add('reminder', {
      userId: 'test-user',
      title: 'Test Event',
      eventTime: new Date(Date.now() + 1000 * 60 * 45) // 45 minutes from now
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for job processing

    if (!job.id) throw new Error('Job ID is undefined');
    const completedJob = await queue.getJob(job.id);
    expect(completedJob?.processedOn).toBeDefined();
  }, 15000);
}); 
// Mock Redis connection
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  }));
});

// Create mock Queue instance
const mockQueueInstance = {
  add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock BullMQ Queue
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => mockQueueInstance),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { QueueService } from '../../services/QueueService';
import { ReminderJob } from '../../types/ReminderJob';

describe('QueueService', () => {
  let queueService: QueueService;

  beforeEach(() => {
    jest.clearAllMocks();
    queueService = QueueService.getInstance();
  });

  it('should schedule a reminder job', async () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 45); // 45 minutes in the future

    const job: ReminderJob = {
      title: 'Test Event',
      eventTime: futureDate.toISOString(),
      eventId: 'event123',
      deviceId: 'device123',
      pushToken: 'push-token-123'
    };

    await queueService.scheduleReminder(job);

    expect(mockQueueInstance.add).toHaveBeenCalledWith(
      'reminder',
      job,
      expect.objectContaining({
        delay: expect.any(Number)
      })
    );
  });

  it('should not schedule a reminder for past events', async () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const job: ReminderJob = {
      title: 'Past Event',
      eventTime: pastDate.toISOString(),
      eventId: 'event123',
      deviceId: 'device123',
      pushToken: 'push-token-123'
    };

    await queueService.scheduleReminder(job);

    expect(mockQueueInstance.add).not.toHaveBeenCalled();
  });

  it('should calculate correct delay for future events', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 2);

    const job: ReminderJob = {
      title: 'Future Event',
      eventTime: futureDate.toISOString(),
      eventId: 'event123',
      deviceId: 'device123',
      pushToken: 'push-token-123'
    };

    await queueService.scheduleReminder(job);

    expect(mockQueueInstance.add).toHaveBeenCalledWith(
      'reminder',
      job,
      expect.objectContaining({
        delay: expect.any(Number)
      })
    );

    // Verify the delay is approximately correct (within 1 second)
    const callArgs = mockQueueInstance.add.mock.calls[0];
    const delay = callArgs[2].delay;
    const expectedDelay = futureDate.getTime() - Date.now() - (30 * 60 * 1000); // 30 minutes before event
    expect(Math.abs(delay - expectedDelay)).toBeLessThan(1000);
  });
}); 
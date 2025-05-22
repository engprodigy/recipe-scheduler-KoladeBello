// Mock Redis connection
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue(undefined),
  }));
});

// Mock the reminderQueue
jest.mock('../../queues/reminderQueue', () => ({
  reminderQueue: {
    add: jest.fn(),
  },
}));

import { QueueService } from '../../services/QueueService';
import { reminderQueue } from '../../queues/reminderQueue';

describe('QueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should schedule a reminder job', async () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 45); // 45 minutes in the future

    const job = {
      userId: 'user123',
      title: 'Test Event',
      eventTime: futureDate,
    };

    await QueueService.scheduleReminder(job);

    expect(reminderQueue.add).toHaveBeenCalledWith(
      'reminder',
      job,
      expect.objectContaining({
        jobId: expect.stringContaining('reminder-user123'),
      })
    );
  });

  it('should not schedule a reminder for past events', async () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const job = {
      userId: 'user123',
      title: 'Past Event',
      eventTime: pastDate,
    };

    await QueueService.scheduleReminder(job);

    expect(reminderQueue.add).not.toHaveBeenCalled();
  });

  it('should calculate correct delay for future events', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 2);

    const job = {
      userId: 'user123',
      title: 'Future Event',
      eventTime: futureDate,
    };

    await QueueService.scheduleReminder(job);

    expect(reminderQueue.add).toHaveBeenCalledWith(
      'reminder',
      job,
      expect.objectContaining({
        delay: expect.any(Number),
      })
    );
  });
}); 
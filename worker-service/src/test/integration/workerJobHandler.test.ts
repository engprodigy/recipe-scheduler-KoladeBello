import { Job } from 'bullmq';
import { reminderJobHandler } from '../../workerJobHandler';
import { NotificationService } from '../../services/NotificationService';

// Mock NotificationService
jest.mock('../../services/NotificationService', () => ({
  NotificationService: {
    getInstance: jest.fn().mockReturnValue({
      sendNotification: jest.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('workerJobHandler', () => {
  let mockJob: Job;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJob = {
      data: {
        eventId: 'test-event-id',
        title: 'Test Event',
        pushToken: 'ExponentPushToken[test-token]'
      }
    } as Job;
  });

  it('should process reminder job and send notification', async () => {
    await reminderJobHandler(mockJob);

    const notificationService = NotificationService.getInstance();
    expect(notificationService.sendNotification).toHaveBeenCalledWith({
      pushToken: 'ExponentPushToken[test-token]',
      title: 'Reminder',
      body: 'Your event "Test Event" is starting soon!',
      data: { eventId: 'test-event-id' }
    });
  });

  it('should handle notification service errors', async () => {
    const error = new Error('Notification failed');
    const notificationService = NotificationService.getInstance();
    (notificationService.sendNotification as jest.Mock).mockRejectedValueOnce(error);

    await expect(reminderJobHandler(mockJob)).rejects.toThrow('Notification failed');
  });
}); 
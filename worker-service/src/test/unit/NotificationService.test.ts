import { Expo } from 'expo-server-sdk';
import { NotificationService } from '../../services/NotificationService';

// Mock Expo SDK
jest.mock('expo-server-sdk', () => {
  const mockExpoInstance = {
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([{ status: 'ok' }])
  };
  return {
    Expo: function () {
      return mockExpoInstance;
    },
  };
});

// Mock the static isExpoPushToken method
(Expo as unknown as { isExpoPushToken: (token: string) => boolean }).isExpoPushToken = jest.fn((token: string) => token.startsWith('ExponentPushToken['));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockExpo: { sendPushNotificationsAsync: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = NotificationService.getInstance();
    mockExpo = new Expo() as unknown as { sendPushNotificationsAsync: jest.Mock };
  });

  it('should send notification with valid push token', async () => {
    const validPayload = {
      pushToken: 'ExponentPushToken[valid-token]',
      title: 'Test Title',
      body: 'Test Body',
      data: { key: 'value' }
    };

    await notificationService.sendNotification(validPayload);

    expect(mockExpo.sendPushNotificationsAsync).toHaveBeenCalledWith([{
      to: validPayload.pushToken,
      sound: 'default',
      title: validPayload.title,
      body: validPayload.body,
      data: validPayload.data
    }]);
  });

  it('should not send notification with invalid push token', async () => {
    const invalidPayload = {
      pushToken: 'invalid-token',
      title: 'Test Title',
      body: 'Test Body',
      data: { key: 'value' }
    };

    await notificationService.sendNotification(invalidPayload);

    expect(mockExpo.sendPushNotificationsAsync).not.toHaveBeenCalled();
  });

  it('should handle notification sending errors', async () => {
    const error = new Error('Failed to send notification');
    mockExpo.sendPushNotificationsAsync.mockRejectedValueOnce(error);

    const payload = {
      pushToken: 'ExponentPushToken[valid-token]',
      title: 'Test Title',
      body: 'Test Body'
    };

    await expect(notificationService.sendNotification(payload)).rejects.toThrow('Failed to send notification');
  });
}); 
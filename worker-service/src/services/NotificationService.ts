import { Expo } from 'expo-server-sdk';
import { NotificationPayload } from '../types/NotificationPayload';

export class NotificationService {
  private static instance: NotificationService;
  private expo: Expo;

  private constructor() {
    this.expo = new Expo();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async sendNotification(payload: NotificationPayload): Promise<void> {
    const { pushToken, title, body, data } = payload;
    
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data
    };

    try {
      await this.expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
} 
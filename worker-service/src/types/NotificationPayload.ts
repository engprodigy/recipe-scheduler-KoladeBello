export interface NotificationPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
} 
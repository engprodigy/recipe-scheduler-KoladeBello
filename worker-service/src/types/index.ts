export interface EventData {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  deviceId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DeviceData {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  pushToken?: string;
}

export interface NotificationPayload {
  deviceId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
} 
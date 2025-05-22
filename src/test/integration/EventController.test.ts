import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../config/database';
import { EventController } from '../../controllers/EventController';
import { Event } from '../../entities/Event';
import { QueueService } from '../../services/QueueService';

// Mock QueueService
jest.mock('../../services/QueueService', () => {
  const mockScheduleReminder = jest.fn().mockImplementation(() => Promise.resolve());
  return {
    QueueService: {
      getInstance: jest.fn().mockReturnValue({
        scheduleReminder: mockScheduleReminder
      })
    }
  };
});

// Get the mock function for assertions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockScheduleReminder = (QueueService.getInstance() as any).scheduleReminder;

describe('Event Controller Integration', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const eventController = new EventController();
    app.post('/api/events', (req, res) => eventController.createEvent(req, res));
  });

  beforeEach(async () => {
    await AppDataSource.getRepository(Event).clear();
    jest.clearAllMocks();
  });

  it('should create a new event successfully', async () => {
    const eventData = {
      title: 'Test Cooking Event',
      eventTime: '2024-03-20T19:00:00Z',
      userId: 'user123',
    };

    const response = await request(app)
      .post('/api/events')
      .send(eventData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(eventData.title);
    expect(response.body.userId).toBe(eventData.userId);
    expect(mockScheduleReminder).toHaveBeenCalled();

    // Verify event was saved in database
    const savedEvent = await AppDataSource.getRepository(Event).findOne({
      where: { id: response.body.id },
    });
    expect(savedEvent).toBeDefined();
    expect(savedEvent?.title).toBe(eventData.title);
  });

  it('should return 400 for invalid event data', async () => {
    const invalidEventData = {
      title: '',
      eventTime: 'invalid-date',
      userId: '',
    };

    const response = await request(app)
      .post('/api/events')
      .send(invalidEventData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(mockScheduleReminder).not.toHaveBeenCalled();
  });
}); 
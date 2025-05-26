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
const mockScheduleReminder = ((QueueService.getInstance() as unknown) as { scheduleReminder: jest.Mock }).scheduleReminder;

describe('Event Controller Integration', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const eventController = new EventController();
    app.post('/api/events', (req, res) => eventController.createEvent(req, res));
    app.get('/api/events', (req, res) => eventController.getEvents(req, res));
    app.get('/api/events/:id', (req, res) => eventController.getEventById(req, res));
    app.put('/api/events/:id', (req, res) => eventController.updateEvent(req, res));
    app.delete('/api/events/:id', (req, res) => eventController.deleteEvent(req, res));
  });

  beforeEach(async () => {
    await AppDataSource.getRepository(Event).clear();
    jest.clearAllMocks();
  });

  describe('POST /api/events', () => {
    it('should create a new event successfully', async () => {
      const eventData = {
        title: 'Test Cooking Event',
        eventTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour in the future
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

    it('should return 400 for past event time', async () => {
      const pastEventData = {
        title: 'Past Event',
        eventTime: new Date(Date.now() - 30000).toISOString(), // 30 seconds in the past
        userId: 'user123',
      };

      const response = await request(app)
        .post('/api/events')
        .send(pastEventData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot create events in the past');
      expect(mockScheduleReminder).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/events', () => {
    it('should return all events for a user', async () => {
      // Create test events
      const eventRepo = AppDataSource.getRepository(Event);
      const testEvents = [
        { title: 'Event 1', eventTime: '2024-03-20T19:00:00Z', userId: 'user123' },
        { title: 'Event 2', eventTime: '2024-03-21T19:00:00Z', userId: 'user123' },
      ];
      await eventRepo.save(testEvents);

      const response = await request(app)
        .get('/api/events')
        .query({ userId: 'user123' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Event 1');
      expect(response.body[1].title).toBe('Event 2');
    });

    it('should return empty array when no events exist', async () => {
      const response = await request(app)
        .get('/api/events')
        .query({ userId: 'user123' })
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event by id', async () => {
      // Create test event
      const eventRepo = AppDataSource.getRepository(Event);
      const testEvent = await eventRepo.save({
        title: 'Test Event',
        eventTime: '2024-03-20T19:00:00Z',
        userId: 'user123',
      });

      const response = await request(app)
        .get(`/api/events/${testEvent.id}`)
        .expect(200);

      expect(response.body.id).toBe(testEvent.id);
      expect(response.body.title).toBe('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      await request(app)
        .get('/api/events/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event successfully', async () => {
      // Create test event
      const eventRepo = AppDataSource.getRepository(Event);
      const testEvent = await eventRepo.save({
        title: 'Original Title',
        eventTime: '2024-03-20T19:00:00Z',
        userId: 'user123',
      });

      const updateData = {
        title: 'Updated Title',
        eventTime: '2024-03-21T19:00:00Z',
      };

      const response = await request(app)
        .put(`/api/events/${testEvent.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.eventTime).toBe('2024-03-21T19:00:00.000Z');

      // Verify update in database
      const updatedEvent = await eventRepo.findOne({
        where: { id: testEvent.id },
      });
      expect(updatedEvent?.title).toBe('Updated Title');
    });

    it('should return 404 when updating non-existent event', async () => {
      const updateData = {
        title: 'Updated Title',
        eventTime: '2024-03-21T19:00:00Z',
      };

      await request(app)
        .put('/api/events/non-existent-id')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event successfully', async () => {
      // Create test event
      const eventRepo = AppDataSource.getRepository(Event);
      const testEvent = await eventRepo.save({
        title: 'Test Event',
        eventTime: '2024-03-20T19:00:00Z',
        userId: 'user123',
      });

      await request(app)
        .delete(`/api/events/${testEvent.id}`)
        .expect(204);

      // Verify deletion
      const deletedEvent = await eventRepo.findOne({
        where: { id: testEvent.id },
      });
      expect(deletedEvent).toBeNull();
    });

    it('should return 404 when deleting non-existent event', async () => {
      await request(app)
        .delete('/api/events/non-existent-id')
        .expect(404);
    });
  });
}); 
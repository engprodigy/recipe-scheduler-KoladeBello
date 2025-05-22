import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../entities/Event';
import { validate } from 'class-validator';
import { QueueService } from '../services/QueueService';

const eventRepository = AppDataSource.getRepository(Event);

export class EventController {
  public async createEvent(req: Request, res: Response): Promise<Response> {
    try {
      const { title, eventTime, userId } = req.body;
      const event = new Event();
      event.title = title;
      event.eventTime = new Date(eventTime);
      event.userId = userId;

      const errors = await validate(event);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const savedEvent = await eventRepository.save(event);
      
      // Schedule reminder
      const queueService = QueueService.getInstance();
      await queueService.scheduleReminder({
        userId: savedEvent.userId,
        title: savedEvent.title,
        eventTime: savedEvent.eventTime,
      });

      return res.status(201).json(savedEvent);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create event' });
    }
  }

  public async getEvents(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.query;
      const events = await eventRepository.find({
        where: { userId: userId as string },
        order: { eventTime: 'ASC' }
      });
      return res.json(events);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  public async updateEvent(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { title, eventTime } = req.body;
      
      const event = await eventRepository.findOne({ where: { id } });
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (title) event.title = title;
      if (eventTime) event.eventTime = new Date(eventTime);

      const errors = await validate(event);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const updatedEvent = await eventRepository.save(event);

      // Reschedule reminder
      const queueService = QueueService.getInstance();
      await queueService.scheduleReminder({
        userId: updatedEvent.userId,
        title: updatedEvent.title,
        eventTime: updatedEvent.eventTime,
      });

      return res.json(updatedEvent);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update event' });
    }
  }

  public async deleteEvent(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const event = await eventRepository.findOne({ where: { id } });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      await eventRepository.remove(event);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  }
} 
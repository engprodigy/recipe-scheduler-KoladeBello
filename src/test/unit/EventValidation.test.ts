import { Event } from '../../entities/Event';
import { validate } from 'class-validator';

describe('Event Validation', () => {
  it('should validate a valid event', async () => {
    const event = new Event();
    event.title = 'Test Cooking Event';
    event.eventTime = new Date('2024-03-20T19:00:00Z');
    event.userId = 'user123';

    const errors = await validate(event);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty title', async () => {
    const event = new Event();
    event.title = '';
    event.eventTime = new Date('2024-03-20T19:00:00Z');
    event.userId = 'user123';

    const errors = await validate(event);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('title');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid date', async () => {
    const event = new Event();
    event.title = 'Test Cooking Event';
    event.eventTime = new Date('invalid-date');
    event.userId = 'user123';

    const errors = await validate(event);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventTime');
    expect(errors[0].constraints).toHaveProperty('isDate');
  });

  it('should fail validation with empty userId', async () => {
    const event = new Event();
    event.title = 'Test Cooking Event';
    event.eventTime = new Date('2024-03-20T19:00:00Z');
    event.userId = '';

    const errors = await validate(event);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });
}); 
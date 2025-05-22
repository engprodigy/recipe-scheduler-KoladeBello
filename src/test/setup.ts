import { AppDataSource } from '../config/database';
import { Event } from '../entities/Event';
import { Device } from '../entities/Device';

beforeAll(async () => {
  // Initialize test database
  await AppDataSource.initialize();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

beforeEach(async () => {
  // Clear all tables before each test
  await AppDataSource.getRepository(Event).clear();
  await AppDataSource.getRepository(Device).clear();
});

afterAll(async () => {
  // Close database connection
  await AppDataSource.destroy();
}); 
import { DataSource } from 'typeorm';
import { Event } from '../entities/Event';
import { Device } from '../entities/Device';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'cooking_events.db',
  synchronize: true,
  logging: true,
  entities: [Event, Device],
  migrations: [],
  subscribers: [],
}); 
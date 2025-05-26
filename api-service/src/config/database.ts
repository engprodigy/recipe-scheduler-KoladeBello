import { DataSource } from 'typeorm';
import { Event } from '../entities/Event';
import { Device } from '../entities/Device';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.API_DATABASE_NAME || 'api_cooking_events.db',
  synchronize: true,
  logging: true,
  entities: [Event, Device],
  migrations: [],
  subscribers: [],
}); 
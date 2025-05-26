import { DataSource } from 'typeorm';
import { Event } from '../entities/Event';
import { Device } from '../entities/Device';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.WORKER_DATABASE_NAME || 'worker_cooking_events.db',
  synchronize: true,
  logging: true,
  entities: [Event, Device],
  migrations: [],
  subscribers: [],
}); 
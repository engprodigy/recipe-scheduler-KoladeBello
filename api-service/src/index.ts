import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import eventRoutes from './routes/eventRoutes';
import deviceRoutes from './routes/deviceRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/devices', deviceRoutes);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 
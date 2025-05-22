import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { EventController } from './controllers/EventController';
import { DeviceController } from './controllers/DeviceController';

const app = express();
const eventController = new EventController();
const deviceController = new DeviceController();

app.use(cors());
app.use(express.json());

// Event routes
app.post('/api/events', (req, res) => eventController.createEvent(req, res));
app.get('/api/events', (req, res) => eventController.getEvents(req, res));
app.patch('/api/events/:id', (req, res) => eventController.updateEvent(req, res));
app.delete('/api/events/:id', (req, res) => eventController.deleteEvent(req, res));

// Device routes
app.post('/api/devices', (req, res) => deviceController.registerDevice(req, res));

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  }); 
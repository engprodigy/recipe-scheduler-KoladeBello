import { Router } from 'express';
import { EventController } from '../controllers/EventController';

const router = Router();
const eventController = new EventController();

// Event routes
router.post('/', (req, res) => eventController.createEvent(req, res));
router.get('/', (req, res) => eventController.getEvents(req, res));
router.patch('/:id', (req, res) => eventController.updateEvent(req, res));
router.delete('/:id', (req, res) => eventController.deleteEvent(req, res));

export default router; 
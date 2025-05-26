import { Router } from 'express';
import { DeviceController } from '../controllers/DeviceController';

const router = Router();
const deviceController = new DeviceController();

// Device routes
router.post('/', (req, res) => deviceController.registerDevice(req, res));

export default router; 
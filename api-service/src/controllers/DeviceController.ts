import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Device } from '../entities/Device';
import { validate } from 'class-validator';

const deviceRepository = AppDataSource.getRepository(Device);

export class DeviceController {
  public async registerDevice(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, pushToken } = req.body;
      const device = new Device();
      device.userId = userId;
      device.pushToken = pushToken;

      const errors = await validate(device);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const savedDevice = await deviceRepository.save(device);
      return res.status(201).json(savedDevice);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to register device' });
    }
  }
} 
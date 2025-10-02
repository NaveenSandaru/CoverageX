import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './../middleware/authentication.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Get all service providers
router.get('/', /*authenticateToken*/ async (req, res) => {
  try {
    const providers = await prisma.service_providers.findMany();
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a service provider by email
router.get('/sprovider/:email', /*authenticateToken*/ async (req, res) => {
  const { email } = req.params;
  try {
    const provider = await prisma.service_providers.findUnique({ where: { email } });
    if (!provider) return res.status(404).json({ error: 'Service provider not found' });
    res.json(provider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a service provider by service_type
router.get('/by_type/:service_type', /*authenticateToken*/ async (req, res) => {
  const { service_type } = req.params;
  try {
    const providers = await prisma.service_providers.findMany({ where: { service_type } });
    if (!providers) return res.status(404).json({ error: 'Service providers not found' });
    res.json(providers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new service provider
router.post('/', async (req, res) => {
  let {
    email, name, company_phone_number, profile_picture,
    company_address, password, language, service_type,
    specialization, work_days_from, work_days_to,
    work_hours_from, work_hours_to, appointment_duration, company_name, appointment_fee
  } = req.body.dataToSend;

  // Ensure appointment_fee is a valid number
  appointment_fee = Number(appointment_fee);

  if (
    !email || !name || !company_phone_number || !password || !language || !service_type ||
    !work_days_from || !work_days_to || !work_hours_from || !work_hours_to ||
    !appointment_duration || !company_name || appointment_fee === undefined || isNaN(appointment_fee)
  ) {
    return res.status(400).json({ error: 'Missing required fields or invalid appointment fee' });
  }

  try {
    // Check if email already exists in clients
    const existingClient = await prisma.clients.findUnique({ where: { email } });

    // Check if email already exists in service_providers
    const existingProvider = await prisma.service_providers.findUnique({ where: { email } });

    if (existingClient || existingProvider) {
      return res.status(409).json({ error: 'Email already in use by another account' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure appointment_fee is an integer
    const appointmentFeeInt = Math.round(appointment_fee);

    // Create new service provider
    const newProvider = await prisma.service_providers.create({
      data: {
        email,
        name,
        company_phone_number,
        profile_picture,
        company_address,
        password: hashedPassword,
        language,
        service_type,
        specialization,
        work_days_from,
        work_days_to,
        work_hours_from: work_hours_from,
        work_hours_to: work_hours_to,
        appointment_duration,
        appointment_fee: appointmentFeeInt,
        company_name
      }
    });

    res.status(201).json(newProvider);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a service provider
router.put('/', /*authenticateToken*/ async (req, res) => {
  const { email, profile_picture: newProfilePicture, password: rawPassword, ...rest } = req.body;

  try {
    const existingProvider = await prisma.service_providers.findUnique({ where: { email } });

    if (!existingProvider) {
      return res.status(404).json({ error: 'Service provider not found' });
    }

    const oldProfilePicture = existingProvider.profile_picture;

    if (oldProfilePicture && newProfilePicture && oldProfilePicture !== newProfilePicture) {
      const filename = path.basename(oldProfilePicture);
      const imagePath = path.join(__dirname, '..', filename);

      try {
        await fs.promises.unlink(imagePath);
        console.log('Old profile picture deleted:', filename);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Error deleting old profile picture:', err.message);
        } else {
          console.log('Old profile picture not found (already deleted).');
        }
      }
    }

    // Build update data
    const updateData = {
      ...rest,
      ...(newProfilePicture && { profile_picture: newProfilePicture }),
      ...(rawPassword && { password: await bcrypt.hash(rawPassword, 10) }),
    };

    const updated = await prisma.service_providers.update({
      where: { email },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Service provider not found' });
    } else {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete a service provider
router.delete('/', /*authenticateToken*/ async (req, res) => {
  const { email } = req.body;
  try {
    const provider = await prisma.service_providers.findUnique({ where: { email } });

    if (!provider) {
      return res.status(404).json({ error: 'Service provider not found' });
    }

    if (provider.profile_picture) {
      const imagePath = path.join(__dirname, '..', provider.profile_picture);
      fs.unlink(imagePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting profile picture:', err.message);
        } else {
          console.log('Profile picture deleted:', provider.profile_picture);
        }
      });
    }

    await prisma.service_providers.delete({ where: { email } });
    res.json({ message: 'Service provider deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Service provider not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

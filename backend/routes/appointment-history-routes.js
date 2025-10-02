import express from 'express';
import { PrismaClient } from '@prisma/client';
import {authenticateToken} from './../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// Get all appointment history records
router.get('/', /*authenticateToken*/ async (req, res) => {
  try {
    const histories = await prisma.appointment_history.findMany();
    res.json(histories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific history record by ID
router.get('/:history_id', /*authenticateToken*/ async (req, res) => {
  const { history_id } = req.params;
  try {
    const history = await prisma.appointment_history.findUnique({ where: { history_id } });
    if (!history) return res.status(404).json({ error: 'History not found' });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new appointment history record
router.post('/', /*authenticateToken*/ async (req, res) => {
  const { history_id, client_email, service_provider_email, date_and_time, status } = req.body;

  if (!history_id || !client_email || !service_provider_email || !date_and_time || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const history = await prisma.appointment_history.create({
      data: {
        history_id,
        client_email,
        service_provider_email,
        date_and_time,
        status
      }
    });
    res.status(201).json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an appointment history record
router.put('/:history_id', /*authenticateToken*/ async (req, res) => {
  const { history_id } = req.params;
  const updateData = req.body;

  try {
    const updated = await prisma.appointment_history.update({
      where: { history_id },
      data: updateData
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'History not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete an appointment history record
router.delete('/:history_id', /*authenticateToken*/ async (req, res) => {
  const { history_id } = req.params;

  try {
    await prisma.appointment_history.delete({ where: { history_id } });
    res.json({ message: 'History deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'History not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

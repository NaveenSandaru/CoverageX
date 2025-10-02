import express from 'express';
import { PrismaClient } from '@prisma/client';
import {authenticateToken} from './../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// Get all ratings
router.get('/', /*authenticateToken*/ async (req, res) => {
  try {
    const ratings = await prisma.ratings.findMany();
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific rating
router.get('/:client_email/:service_provider_email/:history_id', /*authenticateToken*/ async (req, res) => {
  const { client_email, service_provider_email, history_id } = req.params;
  try {
    const rating = await prisma.ratings.findUnique({
      where: {
        client_email_service_provider_email_history_id: {
          client_email,
          service_provider_email,
          history_id,
        },
      },
    });
    if (!rating) return res.status(404).json({ error: 'Rating not found' });
    res.json(rating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a rating
router.post('/', /*authenticateToken*/ async (req, res) => {
  const { client_email, service_provider_email, history_id, rating } = req.body;

  if (!client_email || !service_provider_email || !history_id || rating === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const upserted = await prisma.ratings.upsert({
      where: {
        client_email_service_provider_email_history_id: {
          client_email,
          service_provider_email,
          history_id,
        },
      },
      update: { rating },
      create: {
        client_email,
        service_provider_email,
        history_id,
        rating,
      },
    });
    res.status(201).json(upserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a rating
router.delete('/:client_email/:service_provider_email/:history_id', /*authenticateToken*/ async (req, res) => {
  const { client_email, service_provider_email, history_id } = req.params;
  try {
    await prisma.ratings.delete({
      where: {
        client_email_service_provider_email_history_id: {
          client_email,
          service_provider_email,
          history_id,
        },
      },
    });
    res.json({ message: 'Rating deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Rating not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

import express from 'express';
import { PrismaClient } from '@prisma/client';
import {authenticateToken} from './../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.reviews.findMany();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific review
router.get('/:client_email/:service_provider_email/:history_id', /*authenticateToken*/ async (req, res) => {
  const { client_email, service_provider_email, history_id } = req.params;
  try {
    const review = await prisma.reviews.findUnique({
      where: {
        client_email_service_provider_email_history_id: {
          client_email,
          service_provider_email,
          history_id,
        },
      },
    });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a review
router.post('/', /*authenticateToken*/ async (req, res) => {
  const { client_email, service_provider_email, history_id, review } = req.body;

  if (!client_email || !service_provider_email || !history_id || !review) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const upserted = await prisma.reviews.upsert({
      where: {
        client_email_service_provider_email_history_id: {
          client_email,
          service_provider_email,
          history_id,
        },
      },
      update: { review },
      create: {
        client_email,
        service_provider_email,
        history_id,
        review,
      },
    });
    res.status(201).json(upserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a review
router.delete('/:client_email/:service_provider_email/:history_id', /*authenticateToken*/ async (req, res) => {
  const { client_email, service_provider_email, history_id } = req.params;
  try {
    await prisma.reviews.delete({
      where: {
        client_email_service_provider_email_history_id: {
          client_email,
          service_provider_email,
          history_id,
        },
      },
    });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Review not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

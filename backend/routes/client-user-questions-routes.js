import express from 'express';
import { PrismaClient } from '@prisma/client';
import {authenticateToken} from './../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// Get all questions for all clients
router.get('/', /*authenticateToken*/ async (req, res) => {
  try {
    const answers = await prisma.client_user_questions.findMany();
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all questions for a specific client
router.get('/:email', /*authenticateToken*/ async (req, res) => {
  const { email } = req.params;
  try {
    const answers = await prisma.client_user_questions.findMany({
      where: { email }
    });
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a specific answer
router.post('/', async (req, res) => {
  const { email, answers } = req.body;

  if (!email || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Email and answers array are required' });
  }

  try {
    const results = await Promise.all(
      answers.map(({ question_id, answer }) => {
        if (!question_id || !answer) {
          throw new Error("Missing question_id or answer in one of the items");
        }
        return prisma.client_user_questions.upsert({
          where: {
            email_question_id: { email, question_id },
          },
          update: { answer },
          create: { email, question_id, answer },
        });
      })
    );

    res.status(201).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete a specific answer
router.delete('/:email/:question_id', /*authenticateToken*/ async (req, res) => {
  const { email, question_id } = req.params;
  try {
    await prisma.client_user_questions.delete({
      where: {
        email_question_id: { email, question_id }
      }
    });
    res.json({ message: 'Answer deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Answer not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

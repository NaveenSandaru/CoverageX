import express from 'express';
import { PrismaClient } from '@prisma/client';
import {authenticateToken} from './../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// Get all security questions
router.get('/', /*authenticateToken*/ async (req, res) => {
  try {
    const questions = await prisma.security_questions.findMany();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific question by ID
router.get('/:question_id', /*authenticateToken*/ async (req, res) => {
  const { question_id } = req.params;
  try {
    const question = await prisma.security_questions.findUnique({
      where: { question_id },
    });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new question
router.post('/', /*authenticateToken*/ async (req, res) => {
  const { question_id, question } = req.body;

  if (!question_id || !question) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const created = await prisma.security_questions.create({
      data: { question_id, question },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing question
router.put('/:question_id', /*authenticateToken*/ async (req, res) => {
  const { question_id } = req.params;
  const { question } = req.body;

  try {
    const updated = await prisma.security_questions.update({
      where: { question_id },
      data: { question },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Question not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Delete a question
router.delete('/:question_id', /*authenticateToken*/ async (req, res) => {
  const { question_id } = req.params;
  try {
    await prisma.security_questions.delete({
      where: { question_id },
    });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Question not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;

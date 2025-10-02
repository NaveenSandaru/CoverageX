import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendVerificationCode } from '../utils/mailer.js';
import {authenticateToken} from './../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// Get verification code by email
router.get('/:email', /*authenticateToken*/ async (req, res) => {
  const { email } = req.params;
  try {
    const verification = await prisma.email_verification.findUnique({ where: { email } });
    if (!verification) return res.status(404).json({ error: 'Verification not found' });
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update verification
router.post('/', /*authenticateToken*/ async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const upsert = await prisma.email_verification.upsert({
      where: { email },
      update: { code },
      create: { email, code }
    });

    await sendVerificationCode(email, code);
    res.status(201).json({ message: 'Code sent', data: upsert });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// Verify code
router.post('/verify', /*authenticateToken*/ async (req, res) => {
  const { email, code } = req.body;
  try {
    const record = await prisma.email_verification.findUnique({ where: { email } });
    if (!record || record.code !== code) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    await prisma.email_verification.delete({ where: { email } });
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete verification
router.delete('/:email', /*authenticateToken*/ async (req, res) => {
  const { email } = req.params;
  try {
    await prisma.email_verification.delete({ where: { email } });
    res.json({ message: 'Verification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendVerificationCode } from '../utils/mailer.js';
import {authenticateToken} from './../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// Get verification code by service provider email
router.get('/:email', /*authenticateToken*/ async (req, res) => {
  const { email } = req.params;
  try {
    const record = await prisma.service_provider_email_verification.findUnique({ where: { email } });
    if (!record) return res.status(404).json({ error: 'Verification not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update code
router.post('/', /*authenticateToken*/ async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const upsert = await prisma.service_provider_email_verification.upsert({
      where: { email },
      update: { code },
      create: { email, code }
    });

    await sendVerificationCode(email, code);
    res.status(201).json({ message: 'Code sent', data: upsert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify service provider code
router.post('/verify', /*authenticateToken*/ async (req, res) => {
  const { email, code } = req.body;
  try {
    const record = await prisma.service_provider_email_verification.findUnique({ where: { email } });
    if (!record || record.code !== code) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    await prisma.service_provider_email_verification.delete({ where: { email } });
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete code
router.delete('/:email', /*authenticateToken*/ async (req, res) => {
  const { email } = req.params;
  try {
    await prisma.service_provider_email_verification.delete({ where: { email } });
    res.json({ message: 'Verification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

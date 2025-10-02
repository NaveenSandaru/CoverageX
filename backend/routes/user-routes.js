import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: { user_id: true, email: true, first_name: true, last_name: true },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: req.user.user_id },
      select: { user_id: true, email: true, first_name: true, last_name: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, password } = req.body;
    const data = { first_name, last_name };
    if (password) {
      const bcrypt = await import('bcrypt');
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: req.user.user_id },
      data,
      select: { user_id: true, email: true, first_name: true, last_name: true },
    });

    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/me', authenticateToken, async (req, res) => {
  try {
    await prisma.users.delete({ where: { user_id: req.user.user_id } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

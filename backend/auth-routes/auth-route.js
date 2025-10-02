import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

function generateTokens(user_id, rememberMe = false) {
  const accessToken = jwt.sign({ user_id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ user_id }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '14d' });
  return { accessToken, refreshToken, cookieOptions: { httpOnly: true, sameSite: 'None', secure: true, maxAge: rememberMe ? 14 * 24 * 60 * 60 * 1000 : undefined } };
}

router.post('/register', async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ successful: false, message: 'All fields are required' });
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ successful: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        email,
        first_name,
        last_name,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      successful: true,
      message: 'Registration successful',
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, checked } = req.body;
    if (!email || !password) return res.status(400).json({ successful: false, message: 'Email and password required' });

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(400).json({ successful: false, message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ successful: false, message: 'Invalid email or password' });

    const tokens = generateTokens(user.user_id, checked);

    res.cookie('refreshToken', tokens.refreshToken, tokens.cookieOptions);

    return res.json({ successful: true, message: 'Login successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/google-login', async (req, res) => {
  try {
    const { email, first_name, last_name, ...rest } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    let user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.users.create({ data: { email, first_name, last_name, ...rest } });
    } else {
      user = await prisma.users.update({ where: { email }, data: { first_name, last_name, ...rest } });
    }

    const tokens = generateTokens(user.user_id);

    res.cookie('refreshToken', tokens.refreshToken, tokens.cookieOptions);

    return res.json({ successful: true, message: 'Login successful'});
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/refresh_token', (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.json(false);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ error: err.message });

      const accessToken = jwt.sign({ user_id: decoded.user_id }, process.env.ACCESS_TOKEN_KEY, {
        expiresIn: '15m',
      });

      res.json({ accessToken });
    });
  } catch (err) {
    console.error(err);
    return res.json(false);
  }
});

router.delete('/delete_token', (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
    });
    return res.status(200).json({ message: 'Refresh token deleted' });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

export default router;
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, async (error, decoded) => {
      if (error) return res.status(403).json({ message: 'Invalid token' });

      const user_id = decoded.user_id;

      const user = await prisma.users.findUnique({ where: { user_id } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      req.user = { user_id };
      next();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export { authenticateToken };

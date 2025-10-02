import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwTokens } from '../utils/jwt-helper.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        let user = null;
        let role = '';
        const { email, password, checked } = req.body;
        console.log(req.body);
        console.log(email, password, checked);
        user = await prisma.clients.findUnique({ where: { email } });
        role = "client";
        if (!user) {
            user = await prisma.service_providers.findUnique({ where: { email } });
            if (!user) {
                role = null;
                return res.json({ successful: false, message: 'User not found' });
            }
            role = "sp";
        }
        if(!user.password){
            return res.json({ successful: false, message: 'Invalid password' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.json({ successful: false, message: 'Invalid password' });
        }

        // Check if email is verified by checking if a verification record exists
        const verificationRecord = await prisma.email_verification.findUnique({
            where: { email: user.email }
        });

        // If a verification record exists, the email is not verified yet
        if (verificationRecord) {
            return res.json({
                successful: false,
                message: 'Please verify your email before logging in',
                needsVerification: true,
                email: user.email
            });
        }

        const tokens = jwTokens(user.email, user.name, role);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: checked ? 14 * 24 * 60 * 60 * 1000 : undefined,
          });
          
        console.log("Log in successfull as a" + role); 
        return res.json({
            successful: true,
            message: 'Login successful',
            accessToken: tokens.accessToken,
            user: {
                email: user.email,
                name: user.name,
                role: role
            }
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
    }
});

router.post('/google_login', async (req, res) => {
    try {
        const role = "client";
        const { email, name, ...rest } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user exists
        let user = await prisma.clients.findUnique({ where: { email } });
        if(user && user.password){
            return res.status(500).json({ message: 'Account Already Exists. Login with credentials' });
        }

        if (!user) {
            let user = await prisma.service_providers.findUnique({ where: { email } });
            if(user){
                return res.status(500).json({ message: 'Account Already Exists as a Service Provider' });
            }
            user = await prisma.clients.create({
                data: {
                    email,
                    name,
                    ...rest
                }
            });
        } else {
            // Update existing user info
            user = await prisma.clients.update({
                where: { email },
                data: {
                    name,
                    ...rest
                }
            });
        }

        // Generate tokens
        const tokens = jwTokens(user.email, user.name, role);
        console.log("Google log in success");

        // Set refresh token in cookie (session cookie)
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: undefined
        });

        return res.json({
            successful: true,
            message: 'Login successful',
            accessToken: tokens.accessToken,
            user: {
                email: user.email,
                name: user.name,
                role: role
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/admin_login', async (req, res) => {
    const { id, password, checked } = req.body;
    try {
      const admin = await prisma.admins.findUnique({ where: { id } });
  
      if (!admin || !admin.password) {
        return res.status(401).json({ successful: false, message: 'Invalid credentials' });
      }
  
      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ successful: false, message: 'Invalid credentials' });
      }
  
      const tokens = jwTokens(admin.id, admin.name, "admin");
  
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        maxAge: checked ? 14 * 24 * 60 * 60 * 1000 : undefined,
      });
  
      return res.json({
        successful: true,
        message: 'Login successful',
        accessToken: tokens.accessToken,
        user: {
          email: admin.id,
          name: admin.name,
          role: 'admin',
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  


router.get('/refresh_token', (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.json(false);
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (error, user) => {
            if (error) return res.status(403).json({ error: error.message });

            const { email, name, role } = user;
            const accessToken = jwt.sign({ email, name, role }, process.env.ACCESS_TOKEN_KEY, {
                expiresIn: '15m',
            });

            res.json({ accessToken, user: {email: user.email, name: user.name, role: user.role} });
        });
    } catch (err) {
        console.error(err.message);
        return res.json(false);
    }
});

// DELETE /auth/refresh_token
router.delete('/delete_token', (req, res) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
          });
          
        return res.status(200).json({ message: 'Refresh token deleted' });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

export default router;

import { Router, Request, Response } from 'express';
import { dbManager } from '../db.ts';
import { User } from '@cloudcart/shared/types';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    let user = await dbManager.getUserByEmail(email);

    if (!user) {
      // Auto-provision demo user for simple seamless testing
      const newUser: User = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0] || 'DevOps User',
        role: email.includes('admin') || email.includes('sre') ? 'sre' : 'customer',
        createdAt: new Date().toISOString()
      };
      user = await dbManager.createUser(newUser);
    }

    // Generate lightweight mock JWT token
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 86400000
    })).toString('base64');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const existing = await dbManager.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      name,
      role: role === 'sre' || role === 'admin' ? 'sre' : 'customer',
      createdAt: new Date().toISOString()
    };

    const user = await dbManager.createUser(newUser);

    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 86400000
    })).toString('base64');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const user = await dbManager.getUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token payload' });
  }
});

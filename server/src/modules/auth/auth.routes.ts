import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../users/user.model';
import { env } from '../../config/env';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Generate JWT token
const generateToken = (userId: string, role: string): string => {
    return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: 604800 }); // 7 days in seconds
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await User.findOne({ email: validatedData.email });
        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // Create new user
        const user = await User.create({
            ...validatedData,
            oAuthProvider: 'local',
        });
        const token = generateToken(user._id.toString(), user.role);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues[0].message });
            return;
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        // Find user with password
        const user = await User.findOne({ email: validatedData.email }).select('+password');
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Check password
        const isPasswordValid = await user.comparePassword(validatedData.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const token = generateToken(user._id.toString(), user.role);

        res.json({
            token,
            user: {
                id: user._id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues[0].message });
            return;
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };

        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user._id,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
        });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// --- OAuth Routes ---

import passport from 'passport';

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed` }),
    (req: Request, res: Response) => {
        const user = req.user as any;
        const token = generateToken(user._id.toString(), user.role);
        res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}`);
    }
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
    '/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed` }),
    (req: Request, res: Response) => {
        const user = req.user as any;
        const token = generateToken(user._id.toString(), user.role);
        res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}`);
    }
);

export default router;

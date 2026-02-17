import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface AdminTokenPayload {
    userId: string;
    role: string;
}

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Admin authentication required' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;

        if (decoded.role !== 'admin') {
            res.status(403).json({ error: 'Admin access denied' });
            return;
        }

        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired admin token' });
    }
};

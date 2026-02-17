import express, { Express, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import bookRoutes from './modules/books/book.routes';
import communityRoutes from './modules/community/community.routes';
import searchRoutes from './modules/search/search.routes';
import userRoutes from './modules/users/user.routes';
import importRoutes from './modules/import/import.routes';
import adminRoutes from './modules/admin/admin.routes';
import authorRoutes from './modules/author/author.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import libraryRoutes from './modules/library/readingList.routes';
import genreRoutes from './modules/genres/genre.routes';
import { env } from './config/env';

dotenv.config();

const app: Express = express();

// Security & Performance Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Passport Config ---
import passport from 'passport';
import './config/passport';
app.use(passport.initialize());

// --- Rate Limiting Strategy ---

// 1. Global Limiter - General API usage (Relaxed for SPA)
// 1000 requests per 15 minutes = ~1 request per second average
// Sufficient for normal user browsing without blocking legitimate traffic
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'development' ? 5000 : 1000, // Higher limit in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => {
        // Skip rate limiting for read-only public content to ensure homepage/reading never breaks
        // and for admin dashboard which might fire many parallel requests
        if (req.method === 'GET') {
            const url = req.url;
            return url.startsWith('/api/books') ||
                url.startsWith('/api/genres') ||
                url.startsWith('/api/search') ||
                url.startsWith('/api/admin');
        }
        return false;
    }
});

// 2. Auth Limiter - Strict for Login/Register (Prevent Brute Force)
// 20 requests per minute per IP
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
});

// Apply Limiters
app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// --- Database Connection ---

const connectDB = async (retries = 5) => {
    while (retries > 0) {
        try {
            const mongoUri = env.MONGODB_URI;
            await mongoose.connect(mongoUri);
            console.log('✅ MongoDB connected successfully');

            // Handle runtime connection errors
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB runtime error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
            });

            return;
        } catch (error) {
            console.error(`❌ MongoDB connection failed. Retries left: ${retries - 1}`, error);
            retries -= 1;
            if (retries === 0) {
                console.error('❌ Could not connect to MongoDB. Exiting...');
                process.exit(1);
            }
            // Wait 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api', communityRoutes); // Comments and likes
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/import', importRoutes); // Admin import endpoints
app.use('/api/admin', adminRoutes); // Admin auth & management
app.use('/api/author', authorRoutes); // Author dashboard
app.use('/api/notifications', notificationRoutes); // Notifications
app.use('/api/library', libraryRoutes); // Reading list / bookmarks
app.use('/api/genres', genreRoutes); // Genre catalog

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'KODA Backend is running' });
});

export default app;

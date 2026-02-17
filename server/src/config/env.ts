import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/koda'),
    JWT_SECRET: z.string().min(10),
    JWT_EXPIRES_IN: z.string().default('7d'),
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    // OAuth (optional for Phase 1)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    // In development, allow missing JWT_SECRET with a warning
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Running with default values in development mode');
    } else {
        process.exit(1);
    }
}

export const env = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/koda',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
};

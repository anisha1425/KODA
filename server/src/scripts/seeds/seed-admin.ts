/**
 * Seed admin user in the database
 * Run with: npx ts-node src/scripts/seed-admin.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../../modules/users/user.model';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/koda';

async function seedAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const existing = await User.findOne({ email: 'adminkoda@gmail.com' });
        if (existing) {
            console.log('✅ Admin user already exists');
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
                console.log('🔄 Updated role to admin');
            }
        } else {
            await User.create({
                displayName: 'Admin Koda',
                email: 'adminkoda@gmail.com',
                password: 'admin123',
                role: 'admin',
                oAuthProvider: 'local',
            });
            console.log('✅ Admin user created: adminkoda@gmail.com / admin123');
        }
    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedAdmin();

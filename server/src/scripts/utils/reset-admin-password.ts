/**
 * Force reset admin password
 * Run with: npx ts-node src/scripts/reset-admin-password.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../../modules/users/user.model';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/koda';

async function resetAdminPassword() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'adminkoda@gmail.com';
        const newPassword = 'admin123';

        const user = await User.findOne({ email });

        if (user) {
            user.password = newPassword;
            await user.save();
            console.log(`✅ Password for ${email} has been reset to: ${newPassword}`);
        } else {
            console.log(`❌ User ${email} not found. Running seed-admin.ts might be needed.`);
        }

    } catch (error) {
        console.error('❌ Reset failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

resetAdminPassword();

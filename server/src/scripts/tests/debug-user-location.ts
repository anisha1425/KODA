
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../../modules/users/user.model';

dotenv.config();

const EMAIL_TO_CHECK = 'shreya@gmail.com';
const OLD_URI = process.env.OLD_MONGODB_URI || 'mongodb://localhost:27017/koda_old';
// The current .env should have the NEW URI
const NEW_URI = process.env.MONGODB_URI;

async function checkUserLocation() {
    console.log(`🔍 Searching for user: ${EMAIL_TO_CHECK}`);
    console.log('---------------------------------------------------');

    // 1. Check Old Database
    console.log('1️⃣  Checking OLD Database...');
    try {
        const oldConn = await mongoose.createConnection(OLD_URI).asPromise();
        // @ts-ignore
        const oldUser = await oldConn.model('User', User.schema).findOne({ email: EMAIL_TO_CHECK });

        if (oldUser) {
            console.log(`   ✅ FOUND in OLD Database!`);
            console.log(`   ID: ${oldUser._id}`);
            console.log(`   Created At: ${oldUser.createdAt}`);
        } else {
            console.log(`   ❌ Not found in OLD Database.`);
        }
        await oldConn.close();
    } catch (err) {
        console.error('   ❌ Error checking OLD DB:', err);
    }

    console.log('---------------------------------------------------');

    // 2. Check New Database
    console.log('2️⃣  Checking NEW Database...');
    if (!NEW_URI) {
        console.error('   ❌ NEW_URI is missing from .env');
    } else {
        try {
            const newConn = await mongoose.createConnection(NEW_URI).asPromise();
            // @ts-ignore
            const newUser = await newConn.model('User', User.schema).findOne({ email: EMAIL_TO_CHECK });

            if (newUser) {
                console.log(`   ✅ FOUND in NEW Database!`);
                console.log(`   ID: ${newUser._id}`);
                console.log(`   Created At: ${newUser.createdAt}`);
            } else {
                console.log(`   ❌ Not found in NEW Database.`);
            }
            await newConn.close();
        } catch (err) {
            console.error('   ❌ Error checking NEW DB:', err);
        }
    }
    console.log('---------------------------------------------------');
    process.exit(0);
}

checkUserLocation();

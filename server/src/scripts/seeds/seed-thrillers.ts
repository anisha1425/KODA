/**
 * Seed script to import Thriller novels from Gutenberg
 * Run with: npx ts-node src/scripts/seed-thrillers.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { importGutenbergBooks } from '../../modules/import/gutenberg.service';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/koda';

async function seedThrillers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n📚 Starting Thriller novels import (Limit: 50)...');
        // Import 50 thriller novels
        const result = await importGutenbergBooks(50, ['en'], 'thriller');

        console.log(`\n✅ Seeding complete!`);
        console.log(`📚 Thrillers: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedThrillers();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { importGutenbergBooks } from '../../modules/import/gutenberg.service';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/koda';

const LANGUAGES = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
];

const BOOKS_PER_LANGUAGE = 50;

async function seedLanguages() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log(`\n🌍 Starting Foreign Language Import (${BOOKS_PER_LANGUAGE} books per language)...`);

        for (const lang of LANGUAGES) {
            console.log(`\n📚 Importing ${lang.name} (${lang.code})...`);
            const result = await importGutenbergBooks(BOOKS_PER_LANGUAGE, [lang.code]);
            console.log(`✅ ${lang.name}: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);
        }

        console.log('\n✨ Language Seeding Complete!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedLanguages();

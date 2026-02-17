/**
 * Seed script to import books from Gutenberg and comics from Internet Archive
 * Run with: npx ts-node src/scripts/seed-content.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { importGutenbergBooks } from '../../modules/import/gutenberg.service';
import { importArchiveComics, purgeNsfwComics } from '../../modules/import/archive.service';
import { Book } from '../../modules/books/book.model';
import { Chapter } from '../../modules/books/chapter.model';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/koda';

async function seedContent() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Drop existing text index if it exists to allow schema changes
        try {
            console.log('🧹 ensuring clean text index...');
            await mongoose.connection.collection('books').dropIndex('title_text_authorName_text_description_text');
            console.log('✅ Dropped old text index to update configuration');
        } catch (e) {
            // Index might not exist, which is fine
        }

        // --- Step 1: Purge NSFW comics already in database ---
        console.log('\n🧹 Purging NSFW comics from database...');
        await purgeNsfwComics();

        // --- Step 2: Clean up old Gutenberg data to re-import with better genre mapping ---
        console.log('🧹 Cleaning up old Gutenberg data...');
        const gutenbergBooks = await Book.find({ source: 'gutenberg' }).select('_id');
        const gutenbergBookIds = gutenbergBooks.map(b => b._id);

        if (gutenbergBookIds.length > 0) {
            await Chapter.deleteMany({ bookId: { $in: gutenbergBookIds } });
            await Book.deleteMany({ _id: { $in: gutenbergBookIds } });
            console.log(`✅ Deleted ${gutenbergBooks.length} old Gutenberg books and their chapters`);
        } else {
            console.log('✨ No old Gutenberg data found');
        }

        // --- Step 3: Clean up old Archive comics to re-import with genre mapping ---
        console.log('🧹 Cleaning up old Archive comics...');
        const archiveComics = await Book.find({ source: 'internet_archive' }).select('_id');
        if (archiveComics.length > 0) {
            await Book.deleteMany({ source: 'internet_archive' });
            console.log(`✅ Deleted ${archiveComics.length} old Archive comics`);
        } else {
            console.log('✨ No old Archive data found');
        }

        // --- Step 4: Import Gutenberg novels (500, English) ---
        console.log('\n📚 Starting Gutenberg novels import (Limit: 500)...');
        const novelResult = await importGutenbergBooks(500, ['en']);
        console.log(`📚 Novels: ${novelResult.imported} imported, ${novelResult.skipped} skipped, ${novelResult.errors} errors`);

        // --- Step 5: Import Archive.org comics (500) ---
        console.log('\n🎨 Starting Internet Archive comics import (Limit: 500)...');
        const comicResult = await importArchiveComics(500);
        console.log(`🎨 Comics: ${comicResult.imported} imported, ${comicResult.skipped} skipped, ${comicResult.errors} errors`);

        console.log('\n✅ Seeding complete!');
        console.log(`Total novels: ${novelResult.imported}`);
        console.log(`Total comics: ${comicResult.imported}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedContent();

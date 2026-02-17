
import mongoose from 'mongoose';
import { Book } from '../books/book.model';
import { importGutenbergBooks } from './gutenberg.service';
import { importArchiveComics } from './archive.service';

/**
 * Checks if the database is empty and seeds content if necessary.
 * Designed to run on server startup.
 */
export class ContentSeeder {
    private static isRunning = false;

    /**
     * Check if content exists, if not, seed it.
     */
    static async checkAndSeed(novelLimit = 500, comicLimit = 500) {
        if (this.isRunning) {
            console.log('🔄 Seeder already running, skipping duplicate trigger.');
            return;
        }

        try {
            this.isRunning = true;

            // Check content counts separately
            const novelCount = await Book.countDocuments({ contentType: 'novel' });
            const comicCount = await Book.countDocuments({ contentType: 'comic' });

            console.log(`📊 Content Status: ${novelCount} novels (target: ${novelLimit}), ${comicCount} comics (target: ${comicLimit}).`);

            // 1. Seed Novels (Gutenberg)
            if (novelCount < 10) { // If very few, seed more. prevent over-seeding on restart if limits change slightly.
                console.log(`📚 Low novel count (${novelCount}). Auto-Seeding Novels from Gutenberg...`);
                const indexes = await mongoose.connection.collection('books').indexes();
                // Optional: Check/fix text index if needed here
                await importGutenbergBooks(novelLimit, ['en']);
            } else {
                console.log('✅ Novels sufficient. Skipping import.');
            }

            // 2. Seed Comics (Internet Archive)
            // Note: User reported 91 comics, target is 100. If we have some, we might want to add more 
            // or just skip if we have "enough". Let's seed if we have very few (< 10).
            // Actually, user wants 100. If we have 91, maybe we skip? 
            // Better to skip if we have > 0 to avoid duplicates or re-fetching same data.
            // But if user deleted them to fix NSFW, count might be 0.
            // If we have significantly fewer than target, try to fetch more.
            // Note: Since we use unique checks, running this doesn't hurt, it just tries to find more.
            if (comicCount < comicLimit) {
                console.log(`🎨 Comic count (${comicCount}) below target (${comicLimit}). Fetching more...`);
                await importArchiveComics(comicLimit);
            } else {
                console.log('✅ Comics sufficient. Skipping import.');
            }

            console.log('✨ Auto-Seeding Check Complete.');

        } catch (error) {
            console.error('❌ Auto-Seeding failed:', error);
        } finally {
            this.isRunning = false;
        }
    }
}

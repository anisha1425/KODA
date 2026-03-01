
import mongoose from 'mongoose';
import { Book } from '../books/book.model';
import { importGutenbergBooks } from './gutenberg.service';
import { importArchiveComics } from './archive.service';
import { importMangadexManga } from './mangadex.service';

/**
 * Checks if the database is empty and seeds content if necessary.
 * Designed to run on server startup.
 */
export class ContentSeeder {
    private static isRunning = false;

    /**
     * Check if content exists, if not, seed it.
     */
    static async checkAndSeed(novelLimit = 500, comicLimit = 500, mangaLimit = 100, manhwaLimit = 100) {
        if (this.isRunning) {
            console.log('🔄 Seeder already running, skipping duplicate trigger.');
            return;
        }

        try {
            this.isRunning = true;

            // Check content counts separately
            const novelCount = await Book.countDocuments({ contentType: 'novel' });
            const comicCount = await Book.countDocuments({ contentType: 'comic', source: { $ne: 'mangadex' } });
            const mangaCount = await Book.countDocuments({ source: 'mangadex', language: 'ja' });
            const manhwaCount = await Book.countDocuments({ source: 'mangadex', language: 'ko' });

            console.log(`📊 Content Status: ${novelCount} novels, ${comicCount} comics, ${mangaCount} manga, ${manhwaCount} manhwa.`);

            // 1. Seed Novels (Gutenberg)
            if (novelCount < 10) {
                console.log(`📚 Low novel count (${novelCount}). Auto-Seeding Novels from Gutenberg...`);
                const indexes = await mongoose.connection.collection('books').indexes();
                await importGutenbergBooks(novelLimit, ['en']);
            } else {
                console.log('✅ Novels sufficient. Skipping import.');
            }

            // 2. Seed Comics (Internet Archive)
            if (comicCount < comicLimit) {
                console.log(`🎨 Comic count (${comicCount}) below target (${comicLimit}). Fetching more...`);
                await importArchiveComics(comicLimit);
            } else {
                console.log('✅ Comics sufficient. Skipping import.');
            }

            // 3. Seed Manga (MangaDex - Japanese)
            if (mangaCount < 10) {
                console.log(`📖 Low manga count (${mangaCount}). Auto-Seeding Manga from MangaDex...`);
                await importMangadexManga(mangaLimit, 'manga');
            } else {
                console.log('✅ Manga sufficient. Skipping import.');
            }

            // 4. Seed Manhwa (MangaDex - Korean)
            if (manhwaCount < 10) {
                console.log(`📖 Low manhwa count (${manhwaCount}). Auto-Seeding Manhwa from MangaDex...`);
                await importMangadexManga(manhwaLimit, 'manhwa');
            } else {
                console.log('✅ Manhwa sufficient. Skipping import.');
            }

            console.log('✨ Auto-Seeding Check Complete.');

        } catch (error) {
            console.error('❌ Auto-Seeding failed:', error);
        } finally {
            this.isRunning = false;
        }
    }
}


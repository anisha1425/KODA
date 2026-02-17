import axios from 'axios';
import mongoose from 'mongoose';
import { Book } from '../books/book.model';

const GUTENDEX_API = 'https://gutendex.com/books';

interface GutendexBook {
    id: number;
    title: string;
    authors: { name: string; birth_year?: number; death_year?: number }[];
    subjects: string[];
    bookshelves: string[];
    languages: string[];
    copyright: boolean;
    media_type: string;
    formats: { [key: string]: string };
    download_count: number;
}

interface GutendexResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: GutendexBook[];
}

// Map Gutenberg languages to our language enum
function mapLanguage(lang: string): string {
    const langMap: { [key: string]: string } = {
        'en': 'en', 'es': 'es', 'fr': 'fr', 'de': 'de',
        'ja': 'ja', 'ko': 'ko', 'zh': 'zh', 'hi': 'hi',
        'pt': 'pt', 'ru': 'ru', 'ar': 'ar'
    };
    return langMap[lang] || 'other';
}

// Map Gutenberg subjects to our genres
function mapGenres(subjects: string[]): string[] {
    const genres: string[] = [];
    const subjectStr = subjects.join(' ').toLowerCase();

    if (subjectStr.includes('fantasy') || subjectStr.includes('fairy')) genres.push('fantasy');
    if (subjectStr.includes('science fiction')) genres.push('sci-fi');
    if (subjectStr.includes('romance') || subjectStr.includes('love')) genres.push('romance');
    if (subjectStr.includes('mystery') || subjectStr.includes('detective') || subjectStr.includes('crime')) genres.push('mystery');
    if (subjectStr.includes('thriller') || subjectStr.includes('suspense') || subjectStr.includes('spy') || subjectStr.includes('espionage')) genres.push('thriller');
    if (subjectStr.includes('horror') || subjectStr.includes('ghost') || subjectStr.includes('vampire') || subjectStr.includes('gothic')) genres.push('horror');
    if (subjectStr.includes('action') || subjectStr.includes('war') || subjectStr.includes('battle') || subjectStr.includes('martial') || subjectStr.includes('military') || subjectStr.includes('fight')) genres.push('action');
    if (subjectStr.includes('adventure') || subjectStr.includes('journey') || subjectStr.includes('quest') || subjectStr.includes('expedition') || subjectStr.includes('travel') || subjectStr.includes('pirate') || subjectStr.includes('shipwreck') || subjectStr.includes('sea stor')) genres.push('adventure');
    if (subjectStr.includes('comedy') || subjectStr.includes('humor') || subjectStr.includes('satire') || subjectStr.includes('parody') || subjectStr.includes('wit')) genres.push('comedy');
    if (subjectStr.includes('drama') || subjectStr.includes('tragedy') || subjectStr.includes('tragic')) genres.push('drama');
    if (subjectStr.includes('slice of life') || subjectStr.includes('domestic') || subjectStr.includes('daily life') || subjectStr.includes('diary') || subjectStr.includes('journal') || subjectStr.includes('autobiography')) genres.push('slice-of-life');

    return genres.length > 0 ? genres.slice(0, 3) : ['other'];
}

// Get best available EPUB URL
function getEpubUrl(formats: { [key: string]: string }): string | null {
    return formats['application/epub+zip'] || null;
}

// Get cover image URL
function getCoverUrl(formats: { [key: string]: string }): string | null {
    return formats['image/jpeg'] || null;
}

/**
 * Import Gutenberg books as METADATA ONLY (Lazy Loading approach)
 * Content is fetched on-demand when user opens the reader.
 */
export async function importGutenbergBooks(
    limit: number = 500,
    languages?: string[],
    topic?: string
): Promise<{ imported: number; skipped: number; errors: number }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let nextUrl: string | null = GUTENDEX_API;

    // Build initial URL with query parameters
    const params = new URLSearchParams();
    if (languages && languages.length > 0) {
        params.append('languages', languages.join(','));
    }
    if (topic) {
        params.append('topic', topic);
    }

    if (Array.from(params).length > 0) {
        nextUrl = `${GUTENDEX_API}?${params.toString()}`;
    }

    console.log(`🚀 Starting Gutenberg metadata import (limit: ${limit})...`);
    console.log(`ℹ️  Content will be loaded on-demand when user opens book.`);

    while (nextUrl && imported < limit) {
        try {
            const res = await axios.get(nextUrl);
            const data = res.data as GutendexResponse;
            const results = data.results;
            const nextPage: string | null = data.next;

            for (const book of results) {
                if (imported >= limit) break;

                // Skip if already imported
                const existing = await Book.findOne({ gutenbergId: book.id });
                if (existing) {
                    skipped++;
                    continue;
                }

                const epubUrl = getEpubUrl(book.formats);
                if (!epubUrl) {
                    skipped++;
                    continue;
                }

                try {
                    const coverImage = getCoverUrl(book.formats);

                    // Check for existing translation group (Same title & author)
                    let groupId = new mongoose.Types.ObjectId();
                    const existingTranslation = await Book.findOne({
                        title: book.title.substring(0, 200),
                        authorName: book.authors[0]?.name || 'Unknown Author'
                    }).select('translationGroupId');

                    if (existingTranslation) {
                        if (existingTranslation.translationGroupId) {
                            groupId = existingTranslation.translationGroupId;
                        } else {
                            // Existing book has no group ID, assign the new one to it
                            existingTranslation.translationGroupId = groupId;
                            await existingTranslation.save();
                        }
                    }

                    // Create book with metadata only (no chapters yet)
                    await Book.create({
                        title: book.title.substring(0, 200),
                        author: null,
                        authorName: book.authors[0]?.name || 'Unknown Author',
                        description: `A classic work from Project Gutenberg. Subjects: ${book.subjects.slice(0, 3).join(', ')}`,
                        coverUrl: coverImage || undefined,
                        fileUrl: epubUrl, // Store EPUB URL for lazy loading
                        contentType: 'novel',
                        language: mapLanguage(book.languages[0] || 'en'),
                        genres: mapGenres(book.subjects),
                        totalChapters: 0, // Will be updated on first read
                        isPublic: true,
                        source: 'gutenberg',
                        gutenbergId: book.id,
                        externalUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
                        format: 'epub',
                        subjects: book.subjects.slice(0, 10),
                        translationGroupId: groupId,
                    });

                    imported++;

                    if (imported % 50 === 0) {
                        console.log(`📚 Progress: ${imported}/${limit} books imported...`);
                    }

                } catch (err) {
                    console.error(`❌ Failed to import ${book.title.substring(0, 30)}:`, (err as Error).message);
                    errors++;
                }

                // Minimal rate limiting (metadata only = fast)
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            nextUrl = nextPage;

        } catch (err) {
            console.error('Error fetching from Gutendex:', err);
            break;
        }
    }

    console.log(`✅ Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    return { imported, skipped, errors };
}

import axios from 'axios';
import { Book } from '../books/book.model';

const MANGADEX_API = 'https://api.mangadex.org';

interface MangaDexManga {
    id: string;
    type: 'manga';
    attributes: {
        title: { [lang: string]: string };
        altTitles: { [lang: string]: string }[];
        description: { [lang: string]: string };
        originalLanguage: string;
        lastVolume?: string;
        lastChapter?: string;
        contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
        tags: {
            id: string;
            type: 'tag';
            attributes: { name: { en: string }; group: string };
        }[];
        status: string;
        year?: number;
        createdAt: string;
        updatedAt: string;
    };
    relationships: {
        id: string;
        type: string;
        attributes?: Record<string, unknown>;
    }[];
}

interface MangaDexResponse {
    result: string;
    response: string;
    data: MangaDexManga[];
    limit: number;
    offset: number;
    total: number;
}

// NSFW keyword blocklist (title + tag based)
const NSFW_KEYWORDS = [
    'hentai', 'ecchi', 'doujin', 'doujinshi', 'smut', 'uncensored',
    'porn', 'xxx', 'erotic', 'nsfw', 'nude', 'naked',
    'fetish', 'bondage', 'incest', 'lolicon', 'shotacon',
    'orgy', 'lewd', 'topless', 'hardcore', 'softcore',
    'explicit', 'adult only', 'sex',
];

// Tags to exclude (MangaDex tag names)
const EXCLUDED_TAGS = [
    'Sexual Violence', 'Gore', 'Harem',
    'Reverse Harem', 'Gyaru', 'Loli', 'Shota',
];

// Get the best title (prefer English, then romaji/original)
function getTitle(manga: MangaDexManga): string {
    const titles = manga.attributes.title;
    return (
        titles['en'] ||
        titles['ja-ro'] ||  // romaji
        titles['ko-ro'] ||
        titles['ja'] ||
        titles['ko'] ||
        Object.values(titles)[0] ||
        'Untitled'
    ).substring(0, 200);
}

// Get English description
function getDescription(manga: MangaDexManga): string {
    const desc = manga.attributes.description;
    return (desc['en'] || Object.values(desc)[0] || '').substring(0, 2000);
}

// Map MangaDex tags to our genre enum
function mapGenres(tags: MangaDexManga['attributes']['tags']): string[] {
    const genres: string[] = [];
    const tagNames = tags.map(t => t.attributes.name.en?.toLowerCase() || '');

    if (tagNames.some(t => ['fantasy', 'isekai', 'magic', 'demons', 'monsters'].includes(t))) genres.push('fantasy');
    if (tagNames.some(t => ['sci-fi', 'mecha', 'aliens', 'space'].includes(t))) genres.push('sci-fi');
    if (tagNames.some(t => ['romance', 'love'].includes(t))) genres.push('romance');
    if (tagNames.some(t => ['mystery', 'crime', 'detective'].includes(t))) genres.push('mystery');
    if (tagNames.some(t => ['thriller', 'suspense', 'psychological'].includes(t))) genres.push('thriller');
    if (tagNames.some(t => ['horror', 'supernatural', 'ghosts', 'zombies', 'vampires'].includes(t))) genres.push('horror');
    if (tagNames.some(t => ['action', 'martial arts', 'military', 'samurai', 'ninja'].includes(t))) genres.push('action');
    if (tagNames.some(t => ['adventure', 'survival'].includes(t))) genres.push('adventure');
    if (tagNames.some(t => ['comedy', 'gag humor', 'parody'].includes(t))) genres.push('comedy');
    if (tagNames.some(t => ['drama', 'tragedy'].includes(t))) genres.push('drama');
    if (tagNames.some(t => ['slice of life', 'school life', 'cooking', 'music'].includes(t))) genres.push('slice-of-life');
    if (tagNames.some(t => ['historical'].includes(t))) genres.push('historical');

    return genres.length > 0 ? genres.slice(0, 3) : ['other'];
}

// Get cover art URL from relationships
function getCoverUrl(manga: MangaDexManga): string | undefined {
    const coverRel = manga.relationships.find(r => r.type === 'cover_art');
    if (coverRel && coverRel.attributes) {
        const fileName = (coverRel.attributes as { fileName?: string }).fileName;
        if (fileName) {
            return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
        }
    }
    return undefined;
}

// Get author name from relationships
function getAuthorName(manga: MangaDexManga): string {
    const authorRel = manga.relationships.find(r => r.type === 'author');
    if (authorRel && authorRel.attributes) {
        return (authorRel.attributes as { name?: string }).name || 'Unknown Author';
    }
    return 'Unknown Author';
}

// Check if content is safe based on keyword blocklist
function isSafeContent(manga: MangaDexManga): boolean {
    const title = getTitle(manga).toLowerCase();
    const tagNames = manga.attributes.tags
        .map(t => t.attributes.name.en?.toLowerCase() || '')
        .join(' ');
    const fullText = `${title} ${tagNames}`;

    // Check NSFW keywords
    for (const kw of NSFW_KEYWORDS) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(fullText)) return false;
    }

    // Check excluded tags
    for (const tag of manga.attributes.tags) {
        const tagName = tag.attributes.name.en || '';
        if (EXCLUDED_TAGS.some(excluded => tagName.toLowerCase() === excluded.toLowerCase())) {
            return false;
        }
    }

    return true;
}

/**
 * Import manga or manhwa from MangaDex API (metadata only, lazy loading).
 * @param limit - Maximum number of titles to import
 * @param type - 'manga' for Japanese, 'manhwa' for Korean
 */
export async function importMangadexManga(
    limit: number = 100,
    type: 'manga' | 'manhwa' = 'manga'
): Promise<{ imported: number; skipped: number; errors: number }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const originalLanguage = type === 'manga' ? 'ja' : 'ko';
    const languageCode = originalLanguage;
    const label = type === 'manga' ? 'Manga' : 'Manhwa';

    console.log(`📖 Starting MangaDex ${label} import (limit: ${limit})...`);

    let offset = 0;
    const pageSize = 20; // MangaDex max per request is 100, but 20 is safer for rate limits

    while (imported < limit) {
        try {
            const response = await axios.get<MangaDexResponse>(`${MANGADEX_API}/manga`, {
                params: {
                    'limit': Math.min(pageSize, limit - imported),
                    'offset': offset,
                    'originalLanguage[]': originalLanguage,
                    'contentRating[]': ['safe', 'suggestive'],
                    'order[followedCount]': 'desc', // Most popular first
                    'includes[]': ['cover_art', 'author'],
                    'hasAvailableChapters': true, // Only manga with chapters
                },
                timeout: 30000,
            });

            const mangaList = response.data.data;
            if (mangaList.length === 0) {
                console.log(`📖 No more ${label} results from MangaDex.`);
                break;
            }

            for (const manga of mangaList) {
                if (imported >= limit) break;

                // Skip if already imported
                const existing = await Book.findOne({ mangadexId: manga.id });
                if (existing) {
                    skipped++;
                    continue;
                }

                // NSFW filter
                if (!isSafeContent(manga)) {
                    console.log(`⚠️  Skipping NSFW content: ${getTitle(manga)}`);
                    skipped++;
                    continue;
                }

                try {
                    const title = getTitle(manga);
                    const description = getDescription(manga) ||
                        `A popular ${label} from MangaDex. ${manga.attributes.status === 'completed' ? 'Status: Completed.' : 'Status: Ongoing.'}`;
                    const coverUrl = getCoverUrl(manga);
                    const authorName = getAuthorName(manga);
                    const genres = mapGenres(manga.attributes.tags);

                    await Book.create({
                        title,
                        author: null,
                        authorName,
                        description,
                        coverUrl: coverUrl || undefined,
                        fileUrl: `https://mangadex.org/title/${manga.id}`, // Link to MangaDex reader
                        contentType: 'comic',
                        language: languageCode,
                        genres,
                        totalChapters: 0, // Lazy loaded
                        isPublic: true,
                        source: 'mangadex',
                        mangadexId: manga.id,
                        externalUrl: `https://mangadex.org/title/${manga.id}`,
                        format: 'cbz', // MangaDex serves images
                        subjects: manga.attributes.tags
                            .filter(t => t.attributes.group === 'genre' || t.attributes.group === 'theme')
                            .map(t => t.attributes.name.en)
                            .slice(0, 10),
                    });

                    imported++;

                    if (imported % 20 === 0) {
                        console.log(`📖 Progress: ${imported}/${limit} ${label} imported...`);
                    }
                } catch (err) {
                    console.error(`❌ Failed to import ${getTitle(manga)}:`, (err as Error).message);
                    errors++;
                }
            }

            offset += pageSize;

            // Rate limiting — MangaDex asks for max 5 req/s; we use 500ms between pages
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err) {
            console.error(`Error fetching from MangaDex:`, (err as Error).message);
            // If rate limited, wait longer and retry
            if (axios.isAxiosError(err) && err.response?.status === 429) {
                console.log('⏳ Rate limited by MangaDex. Waiting 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue; // Retry same offset
            }
            break;
        }
    }

    console.log(`✅ MangaDex ${label} import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    return { imported, skipped, errors };
}

/**
 * Purge NSFW manga/manhwa already in the database.
 */
export async function purgeNsfwMangadex(): Promise<number> {
    const nsfwKeywords = NSFW_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

    const result = await Book.deleteMany({
        source: 'mangadex',
        $or: [
            { title: { $regex: nsfwKeywords, $options: 'i' } },
            { description: { $regex: nsfwKeywords, $options: 'i' } },
        ],
    });

    console.log(`🧹 Purged ${result.deletedCount} NSFW manga/manhwa from database`);
    return result.deletedCount;
}

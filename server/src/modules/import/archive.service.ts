import axios from 'axios';
import { Book } from '../books/book.model';

const ARCHIVE_API = 'https://archive.org/advancedsearch.php';

interface ArchiveItem {
    identifier: string;
    title: string;
    creator?: string;
    description?: string;
    subject?: string | string[];
    language?: string;
    mediatype: string;
    downloads?: number;
}

interface ArchiveResponse {
    response: {
        numFound: number;
        start: number;
        docs: ArchiveItem[];
    };
}

// Map Archive.org language codes
function mapLanguage(lang?: string): string {
    if (!lang) return 'en';
    const langLower = lang.toLowerCase();
    const langMap: { [key: string]: string } = {
        'english': 'en', 'en': 'en',
        'spanish': 'es', 'es': 'es',
        'french': 'fr', 'fr': 'fr',
        'german': 'de', 'de': 'de',
        'hindi': 'hi', 'hi': 'hi',
    };
    return langMap[langLower] || 'other';
}

// Get cover image URL for Archive.org item
function getCoverUrl(identifier: string): string {
    return `https://archive.org/services/img/${identifier}`;
}

// Get viewer URL for Archive.org item
function getViewerUrl(identifier: string): string {
    return `https://archive.org/details/${identifier}`;
}

// Map Archive.org subjects to our app genres
function mapGenres(subjects: string[]): string[] {
    const genres: string[] = [];
    const subjectStr = subjects.join(' ').toLowerCase();

    if (subjectStr.includes('superhero') || subjectStr.includes('action') || subjectStr.includes('war') || subjectStr.includes('battle') || subjectStr.includes('fight') || subjectStr.includes('martial')) genres.push('action');
    if (subjectStr.includes('fantasy') || subjectStr.includes('fairy') || subjectStr.includes('magic') || subjectStr.includes('dragon') || subjectStr.includes('wizard')) genres.push('fantasy');
    if (subjectStr.includes('science fiction') || subjectStr.includes('sci-fi') || subjectStr.includes('space') || subjectStr.includes('robot') || subjectStr.includes('alien')) genres.push('sci-fi');
    if (subjectStr.includes('romance') || subjectStr.includes('love')) genres.push('romance');
    if (subjectStr.includes('mystery') || subjectStr.includes('detective') || subjectStr.includes('crime')) genres.push('mystery');
    if (subjectStr.includes('thriller') || subjectStr.includes('suspense') || subjectStr.includes('spy') || subjectStr.includes('espionage')) genres.push('thriller');
    if (subjectStr.includes('horror') || subjectStr.includes('ghost') || subjectStr.includes('zombie') || subjectStr.includes('vampire') || subjectStr.includes('monster')) genres.push('horror');
    if (subjectStr.includes('adventure') || subjectStr.includes('journey') || subjectStr.includes('quest') || subjectStr.includes('expedition') || subjectStr.includes('pirate')) genres.push('adventure');
    if (subjectStr.includes('comedy') || subjectStr.includes('humor') || subjectStr.includes('funny') || subjectStr.includes('cartoon') || subjectStr.includes('parody') || subjectStr.includes('satire')) genres.push('comedy');
    if (subjectStr.includes('drama') || subjectStr.includes('tragedy')) genres.push('drama');
    if (subjectStr.includes('slice of life') || subjectStr.includes('daily') || subjectStr.includes('domestic') || subjectStr.includes('family life')) genres.push('slice-of-life');

    return genres.length > 0 ? genres.slice(0, 3) : ['other'];
}

// Check for NSFW content in metadata (uses word-boundary matching to avoid false positives)
function isSafeContent(item: ArchiveItem): boolean {
    // Strict NSFW keywords — checked in title+subjects only (not description, which is noisy)
    const strictKeywords = [
        'porn', 'xxx', 'hentai', 'erotic', 'nsfw', '18\\+',
        'naked', 'fetish', 'bondage', 'playboy', 'penthouse',
        'hustler', 'milf', 'incest', 'lolita', 'shunga',
        'orgy', 'ecchi', 'doujin', 'smut', 'uncensored',
        'gravure', 'softcore', 'hardcore',
        'how to draw', 'drawing', 'art book', 'visual book', 'illustration', 'magazine',
        'sketchbook', 'guide', 'tutorial', 'technique', 'posing',
        'figure drawing', 'life drawing', 'anatomy', 'anatomy for artists',
        'realistic skin', 'lewd', 'topless',
        'vampirella', 'red sonja', 'tarzan', 'conan', 'dejah thoris', 'jungle girl',
        'cavewoman', 'lady death', 'purgatori', 'boundless', 'avatar press',
        'sheena', 'gal gohan', 'condorita', 'devilhs', 'hi life', 'adult', 'sonichu',
        'alfie'
    ];

    // Title-only: broad keywords that cause false positives in descriptions/subjects
    const titleOnlyKeywords = [
        'nude', 'adult only', 'sex(?:ual)?', 'explicit', 'bikini',
        'lingerie', 'pinup', 'pin-up', 'burlesque', 'provocative',
        'swimsuit', 'sexy', 'seductive', 'risque', 'skin tone',
        'skin color', 'painting skin'
    ];

    const titleText = (item.title || '').toLowerCase();
    const subjects = Array.isArray(item.subject) ? item.subject : [item.subject || ''];
    const subjectText = subjects.join(' ').toLowerCase();
    const fullText = [titleText, subjectText].join(' ');

    // Check strict keywords in title + subjects (NOT description)
    for (const kw of strictKeywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(fullText)) return false;
    }

    // Check title-only keywords
    for (const kw of titleOnlyKeywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(titleText)) return false;
    }

    return true;
}

// Purge NSFW comics already in the database
export async function purgeNsfwComics(): Promise<number> {
    const nsfwKeywords = [
        'porn', 'nude', 'adult', 'xxx', 'hentai', 'sex', 'erotic', 'nsfw', 'explicit',
        'naked', 'ecchi', 'doujin', 'yaoi', 'yuri', 'smut', 'uncensored',
        'gravure', 'pinup', 'bikini', 'lingerie', 'softcore', 'hardcore',
        'how to draw', 'drawing', 'art book', 'visual book', 'illustration', 'magazine',
        'sketchbook', 'guide', 'tutorial', 'technique', 'posing',
        'figure drawing', 'life drawing', 'anatomy',
        'realistic skin', 'skin color', 'skin tone',
        'sexy', 'seductive', 'provocative', 'lewd', 'topless', 'burlesque',
        'vampirella', 'red sonja', 'tarzan', 'conan', 'dejah thoris', 'jungle girl',
        'cavewoman', 'lady death', 'purgatori', 'boundless', 'avatar press',
        'sheena', 'gal gohan', 'condorita', 'devilhs', 'hi life', 'sonichu',
        'alfie'
    ];

    // Build regex pattern to match any NSFW keyword in title
    const regexPattern = nsfwKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const result = await Book.deleteMany({
        source: 'internet_archive',
        $or: [
            { title: { $regex: regexPattern, $options: 'i' } },
            { description: { $regex: regexPattern, $options: 'i' } },
        ]
    });

    console.log(`🧹 Purged ${result.deletedCount} NSFW comics from database`);
    return result.deletedCount;
}

// Genre-specific queries for diverse comic imports
interface GenreQuery {
    query: string;
    genre: string; // Fallback genre if subject mapping fails
}

export async function importArchiveComics(
    limit: number = 500,
    language?: string
): Promise<{ imported: number; skipped: number; errors: number }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`🎨 Starting Internet Archive comics import (limit: ${limit})...`);

    try {
        // Use -collection:computersandtechmanuals to avoid technical docs
        let baseFilter = 'mediatype:texts AND (subject:comic OR subject:comics OR subject:"comic book" OR subject:"comic books" OR subject:"graphic novel")';
        if (language) {
            baseFilter += ` AND language:${language}`;
        }
        const excludeTerms = '-porn -nude -xxx -hentai -erotic -bikini -lingerie';

        // Genre-targeted queries for diverse results
        const genreQueries: GenreQuery[] = [
            // Action
            { query: `${baseFilter} AND (subject:superhero OR subject:superheroes OR subject:"super hero") ${excludeTerms}`, genre: 'action' },
            { query: `${baseFilter} AND (subject:war OR subject:battle OR subject:military OR subject:soldier) ${excludeTerms}`, genre: 'action' },
            // Fantasy
            { query: `${baseFilter} AND (subject:fantasy OR subject:magic OR subject:dragon OR subject:wizard) ${excludeTerms}`, genre: 'fantasy' },
            // Sci-fi
            { query: `${baseFilter} AND (subject:"science fiction" OR subject:sci-fi OR subject:space OR subject:robot) ${excludeTerms}`, genre: 'sci-fi' },
            // Mystery
            { query: `${baseFilter} AND (subject:mystery OR subject:detective OR subject:crime) ${excludeTerms}`, genre: 'mystery' },
            // Thriller
            { query: `${baseFilter} AND (subject:thriller OR subject:suspense OR subject:spy OR subject:espionage) ${excludeTerms}`, genre: 'thriller' },
            // Horror
            { query: `${baseFilter} AND (subject:horror OR subject:ghost OR subject:zombie OR subject:vampire OR subject:monster) ${excludeTerms}`, genre: 'horror' },
            // Romance
            { query: `${baseFilter} AND (subject:romance OR subject:love) ${excludeTerms}`, genre: 'romance' },
            // Comedy
            { query: `${baseFilter} AND (subject:comedy OR subject:humor OR subject:funny OR subject:cartoon OR subject:parody OR subject:satire) ${excludeTerms}`, genre: 'comedy' },
            // Adventure
            { query: `${baseFilter} AND (subject:adventure OR subject:pirate OR subject:treasure OR subject:western OR subject:jungle) ${excludeTerms}`, genre: 'adventure' },
            // Drama
            { query: `${baseFilter} AND (subject:drama OR subject:tragedy OR subject:"graphic novel") ${excludeTerms}`, genre: 'drama' },
            // Slice of life
            { query: `${baseFilter} AND (subject:"slice of life" OR subject:"daily life" OR subject:family OR subject:school) ${excludeTerms}`, genre: 'slice-of-life' },
            // General/Other — broad comic catchall
            { query: `${baseFilter} ${excludeTerms}`, genre: 'other' },
        ];

        const perGenreTarget = Math.ceil(limit / genreQueries.length);

        for (const gq of genreQueries) {
            if (imported >= limit) break;

            const remaining = Math.min(perGenreTarget, limit - imported);
            let fetched = 0;
            let page = 1;
            const maxPages = 5; // Prevent infinite loops

            while (fetched < remaining && imported < limit && page <= maxPages) {
                try {
                    const response = await axios.get<ArchiveResponse>(ARCHIVE_API, {
                        params: {
                            q: gq.query,
                            fl: ['identifier', 'title', 'creator', 'description', 'subject', 'language', 'mediatype', 'downloads'],
                            sort: ['downloads desc'],
                            rows: 100,
                            page,
                            output: 'json',
                        },
                    });

                    const items = response.data.response.docs;
                    if (items.length === 0) break; // No more results

                    for (const item of items) {
                        if (imported >= limit) break;

                        // NSFW check
                        if (!isSafeContent(item)) {
                            console.log(`⚠️  Skipping potentially NSFW content: ${item.title}`);
                            skipped++;
                            continue;
                        }

                        // Skip if already imported
                        const existing = await Book.findOne({ archiveId: item.identifier });
                        if (existing) {
                            skipped++;
                            fetched++;
                            continue;
                        }

                        try {
                            const subjects = Array.isArray(item.subject)
                                ? item.subject
                                : item.subject
                                    ? [item.subject]
                                    : [];

                            // Map subjects to genres, with fallback to the query's target genre
                            let genres = mapGenres(subjects);
                            if (genres.length === 1 && genres[0] === 'other') {
                                genres = [gq.genre];
                            }

                            await Book.create({
                                title: (item.title || 'Untitled Comic').substring(0, 200),
                                author: null,
                                authorName: item.creator || 'Unknown',
                                description: item.description?.substring(0, 2000) || 'A public domain comic from Internet Archive.',
                                coverUrl: getCoverUrl(item.identifier),
                                fileUrl: getViewerUrl(item.identifier),
                                contentType: 'comic',
                                language: mapLanguage(item.language),
                                genres,
                                totalChapters: 1,
                                isPublic: true,
                                source: 'internet_archive',
                                archiveId: item.identifier,
                                externalUrl: getViewerUrl(item.identifier),
                                format: 'cbz',
                                subjects: subjects.slice(0, 10),
                            });
                            imported++;
                            fetched++;

                            if (imported % 50 === 0) {
                                console.log(`🎨 Imported ${imported} comics...`);
                            }
                        } catch (err) {
                            errors++;
                        }
                    }

                    page++;
                } catch (err) {
                    console.error(`Error fetching page ${page} for query "${gq.genre}":`, err);
                    break;
                }

                // Rate limiting between pages
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`📦 Genre "${gq.genre}": fetched ${fetched}, total imported so far: ${imported}`);

            // Rate limiting between genre queries
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (err) {
        console.error('Error fetching from Internet Archive:', err);
    }

    console.log(`✅ Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    return { imported, skipped, errors };
}

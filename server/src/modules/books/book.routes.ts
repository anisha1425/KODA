import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { uploadMiddleware, UPLOAD_CONFIG } from '../../config/upload';
import { Book } from './book.model';
import { Chapter } from './chapter.model';
import { ReadingProgress } from './readingProgress.model';
import { authenticate, AuthRequest, requireRole, optionalAuth } from '../../middleware/auth.middleware';
import { parseEpub } from '../../utils/epubParser';
import { parseComic } from '../../utils/comicParser';

const router = Router();

// Validation schema for book creation
const createBookSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    language: z.enum(['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'hi', 'pt', 'ru', 'ar', 'other']).default('en'),
    genres: z.array(z.string()).max(3).optional(),
});

// Simple seeded random number generator
function getSeededRandom(seed: number) {
    let value = seed;
    return function () {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    }
}

// Helper to shuffle array with seed
function shuffleArray<T>(array: T[], seed: number): T[] {
    const random = getSeededRandom(seed);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// GET /api/books/trending - Get trending books (refreshes every 30 mins)
router.get('/trending', async (req: Request, res: Response) => {
    try {
        // 1. Get current 30-min window seed
        const timestamp = Date.now();
        const thirtyMins = 30 * 60 * 1000;
        const seed = Math.floor(timestamp / thirtyMins);

        // 2. Fetch top 100 books by views (stable pool)
        const books = await Book.find({ isPublic: true })
            .sort({ views: -1 })
            .limit(100)
            .lean();

        if (books.length === 0) {
            res.json([]);
            return;
        }

        // 3. Sort by ID for deterministic shuffling input
        // (prevents jitter if view counts change slightly within the window)
        books.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

        // 4. Shuffle using time-based seed
        const shuffled = shuffleArray(books, seed);

        // 5. Return first 10 items for Trending
        const trending = shuffled.slice(0, 10);

        res.json(trending);
    } catch (error) {
        console.error('Get trending error:', error);
        res.status(500).json({ error: 'Failed to fetch trending books' });
    }
});

// GET /api/books/recommended - Get recommended books (refreshes every 30 mins)
router.get('/recommended', async (req: Request, res: Response) => {
    try {
        // 1. Get current 30-min window seed (MUST MATCH Trending to ensure exclusion)
        const timestamp = Date.now();
        const thirtyMins = 30 * 60 * 1000;
        const seed = Math.floor(timestamp / thirtyMins);

        // 2. Fetch same top 100 pool
        const books = await Book.find({ isPublic: true })
            .sort({ views: -1 })
            .limit(100)
            .lean();

        if (books.length === 0) {
            res.json([]);
            return;
        }

        // 3. Deterministic sort
        books.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

        // 4. Shuffle using SAME seed
        const shuffled = shuffleArray(books, seed);

        // 5. Return NEXT 12 items (indices 10-21) for Recommended
        // This ensures they are distinct from Trending (0-9)
        const recommended = shuffled.slice(10, 22);

        // Fallback: If total books < 10, recommended might be empty with this slice.
        // If so, just return whatever is available excluding trending if possible,
        // or just return the rest.
        if (recommended.length === 0 && books.length > 0) {
            // Case: Very few books in DB. distinctness matters less than showing content.
            // Just return shuffle excluding first 10 if possible.
            const fallback = shuffled.slice(10);
            res.json(fallback);
            return;
        }

        res.json(recommended);
    } catch (error) {
        console.error('Get recommended error:', error);
        res.status(500).json({ error: 'Failed to fetch recommended books' });
    }
});

// GET /api/books - Get all books
router.get('/', async (req: Request, res: Response) => {
    try {
        const { contentType, language, genre, sortBy, translationGroupId, page = 1, limit = 20 } = req.query;
        const filter: Record<string, unknown> = { isPublic: true };
        if (contentType) filter.contentType = contentType;
        if (language) filter.language = language;
        if (genre) filter.genres = { $in: [genre] };
        if (translationGroupId) filter.translationGroupId = translationGroupId;

        const skip = (Number(page) - 1) * Number(limit);

        // Sorting
        let sort: Record<string, 1 | -1> = { createdAt: -1 };
        if (sortBy === 'views') {
            sort = { views: -1 };
        } else if (sortBy === 'likes') {
            sort = { likes: -1 };
        }

        const [books, total] = await Promise.all([
            Book.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Book.countDocuments(filter),
        ]);

        res.json({
            books,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// GET /api/books/:id - Get single book
router.get('/:id', async (req: Request, res: Response) => {
    try {
        // Atomic update: Increment views and return the updated document
        // This is much more efficient than find() + save()
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!book) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }

        res.json(book);
    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

// GET /api/books/:id/chapters - Get chapters
router.get('/:id/chapters', async (req: Request, res: Response) => {
    try {
        const includeContent = req.query.includeContent === 'true';

        let query = Chapter.find({ bookId: req.params.id }).sort({ orderIndex: 1 });

        if (!includeContent) {
            // @ts-ignore - Mongoose typings issue with select() return type
            query = query.select('title orderIndex');
        }

        const chapters = await query.lean();

        // If including content, we might need to transform local paths to URLs for comics
        if (includeContent) {
            // Check if it's a comic by inspecting the first chapter's content
            // or we could check the book type, but we don't fetch the book here.
            // A heuristic: if content starts with the upload dir, it's a local file.

            const chaptersWithUrls = chapters.map(ch => {
                if (ch.content && typeof ch.content === 'string' && ch.content.startsWith(UPLOAD_CONFIG.UPLOAD_DIR)) {
                    // It's likely a local file path (comic page)
                    // Convert absolute path to relative URL: /uploads/comic_X/page_Y.jpg

                    // UPLOAD_DIR is /.../uploads
                    // content is /.../uploads/comic_123/page.jpg
                    // relative is comic_123/page.jpg
                    const relativePath = path.relative(UPLOAD_CONFIG.UPLOAD_DIR, ch.content);

                    // Construct URL
                    const url = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
                    return { ...ch, content: url };
                }
                return ch;
            });

            res.json(chaptersWithUrls);
            return;
        }

        res.json(chapters);
    } catch (error) {
        console.error('Get chapters error:', error);
        res.status(500).json({ error: 'Failed to fetch chapters' });
    }
});

// GET /api/books/:id/chapters/:chapterIndex - Get chapter content
router.get('/:id/chapters/:chapterIndex', async (req: Request, res: Response) => {
    try {
        const chapter = await Chapter.findOne({
            bookId: req.params.id,
            orderIndex: Number(req.params.chapterIndex),
        });

        if (!chapter) {
            res.status(404).json({ error: 'Chapter not found' });
            return;
        }

        res.json(chapter);
    } catch (error) {
        console.error('Get chapter error:', error);
        res.status(500).json({ error: 'Failed to fetch chapter' });
    }
});

// POST /api/books/:id/fetch-content - Lazy load: Download and parse EPUB on-demand
router.post('/:id/fetch-content', async (req: Request, res: Response) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }

        // Check for force refresh query param
        const forceRefresh = req.query.force === 'true';

        // Check if content already exists
        const existingChapters = await Chapter.countDocuments({ bookId: book._id });
        if (existingChapters > 0 && !forceRefresh) {
            res.json({ message: 'Content already loaded', totalChapters: existingChapters });
            return;
        }

        // If force refresh, delete existing chapters first
        if (existingChapters > 0 && forceRefresh) {
            console.log(`🔄 Force refresh: Deleting ${existingChapters} existing chapters...`);
            await Chapter.deleteMany({ bookId: book._id });
        }

        // Check if this is an external book with EPUB URL
        if (!book.fileUrl || book.source === 'user') {
            res.status(400).json({ error: 'No external content to fetch' });
            return;
        }

        // Dynamic import for axios (to avoid top-level import issues)
        const axios = (await import('axios')).default;
        const os = await import('os');
        const fsSync = await import('fs');

        // Download EPUB
        const tempDir = path.join(os.tmpdir(), 'koda-lazy-load');
        if (!fsSync.existsSync(tempDir)) {
            fsSync.mkdirSync(tempDir, { recursive: true });
        }

        const tempPath = path.join(tempDir, `${book._id}.epub`);

        console.log(`📥 Lazy loading: Downloading ${book.title}...`);
        const response = await axios.get(book.fileUrl, {
            responseType: 'arraybuffer',
            timeout: 60000 // 60s timeout for larger books
        });
        await fs.writeFile(tempPath, response.data);

        // Parse EPUB
        console.log(`📖 Lazy loading: Parsing...`);
        const parsed = await parseEpub(tempPath);

        // Create chapters
        const chaptersToInsert = parsed.chapters.map((ch, idx) => ({
            bookId: book._id,
            title: ch.title || `Chapter ${idx + 1}`,
            content: ch.content,
            orderIndex: ch.orderIndex,
        }));
        await Chapter.insertMany(chaptersToInsert);

        // Update book totalChapters
        book.totalChapters = parsed.chapters.length;
        await book.save();

        // Cleanup temp file
        await fs.unlink(tempPath).catch(() => { });

        console.log(`✅ Lazy loading complete: ${book.title} (${parsed.chapters.length} chapters)`);

        res.json({
            message: 'Content loaded successfully',
            totalChapters: parsed.chapters.length
        });
    } catch (error) {
        console.error('Fetch content error:', error);
        res.status(500).json({ error: 'Failed to fetch content. Please try again.' });
    }
});

// POST /api/books/upload - Upload book (protected)
router.post(
    '/upload',
    authenticate,
    requireRole('author', 'admin'),
    uploadMiddleware.fields([
        { name: 'file', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]),
    async (req: AuthRequest, res: Response) => {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const bookFile = files['file']?.[0];
            const coverFile = files['cover']?.[0];

            if (!bookFile) {
                res.status(400).json({ error: 'No book file uploaded' });
                return;
            }

            // Parse genres if sent as JSON string (from client FormData)
            if (req.body.genres && typeof req.body.genres === 'string') {
                try {
                    req.body.genres = JSON.parse(req.body.genres);
                } catch (e) {
                    // If not valid JSON, assume it's a single genre string and wrap in array
                    req.body.genres = [req.body.genres];
                }
            }

            // Normalize genres to lowercase
            if (req.body.genres && Array.isArray(req.body.genres)) {
                req.body.genres = req.body.genres.map((g: string) => g.toLowerCase());
            }

            const validation = createBookSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({ error: validation.error.issues[0].message });
                return;
            }

            const filePath = bookFile.path;
            const ext = path.extname(bookFile.originalname).toLowerCase();
            const isComic = ['.cbz', '.cbr', '.zip'].includes(ext);
            const contentType = isComic ? 'comic' : 'novel';

            let bookData: {
                title: string;
                author: string;
                chapters: { title?: string; content: string; orderIndex: number }[];
                coverPath?: string;
            };

            if (isComic) {
                const parsed = await parseComic(filePath, UPLOAD_CONFIG.UPLOAD_DIR);
                bookData = {
                    title: validation.data.title || parsed.title,
                    author: req.user!.displayName,
                    chapters: parsed.pages.map((p) => ({
                        content: p.imagePath, // Store image path as content
                        orderIndex: p.orderIndex,
                    })),
                };
            } else {
                const parsed = await parseEpub(filePath);
                bookData = {
                    title: validation.data.title || parsed.title,
                    author: parsed.author,
                    chapters: parsed.chapters,
                    coverPath: parsed.coverPath,
                };
            }

            // Use uploaded cover if provided, otherwise fallback to extracted cover
            const finalCoverUrl = coverFile ? `/uploads/temp/${path.basename(coverFile.path)}` : bookData.coverPath;

            // Create book
            const book = await Book.create({
                title: bookData.title,
                author: req.userId,
                authorName: req.user!.displayName,
                description: validation.data.description,
                coverUrl: finalCoverUrl,
                fileUrl: filePath,
                contentType,
                language: validation.data.language,
                genres: validation.data.genres || [],
                totalChapters: bookData.chapters.length,
                status: 'pending', // Explicitly set status to pending for admin approval
                isPublic: false, // Ensure book is not visible until approved
            });

            // Create chapters
            const chaptersToInsert = bookData.chapters.map((ch) => ({
                bookId: book._id,
                title: ch.title,
                content: ch.content,
                orderIndex: ch.orderIndex,
            }));
            await Chapter.insertMany(chaptersToInsert);

            // Cleanup temp file (book file only, keep cover if used)
            // Note: In a real app we'd move these to permanent storage
            // For now, we keep them in temp or move them? 
            // The parser might rely on the file existing? 
            // The original code unlinked filePath.
            // But we changed coverURL to point to /uploads/temp/... which implies we shouldn't delete it immediately if we want to serve it?
            // However, existing code unlinked filePath. Let's stick to that for the book file.
            // For cover file, if we use it, we should probably not delete it if we want to serve it from temp.
            // But usually we should move it to a permanent location.
            // For the purpose of this fix, I'll assume standard behavior.

            // If we unlink the book file, it might break lazy loading if it relies on fileUrl?
            // The original code calculated fileUrl = filePath and then unlinked filePath. 
            // That seems wrong if lazy loading needs it (unless lazy loading re-downloads).
            // But here we are uploading a file. 
            // Let's just unlink the book file as before to avoid regression, 
            // but for the cover file, we need it to persist if we reference it.
            // I'll leave cover file alone for now (it's in temp).

            await fs.unlink(filePath).catch(() => { });

            res.status(201).json({
                message: 'Book uploaded successfully',
                book: {
                    id: book._id,
                    title: book.title,
                    contentType: book.contentType,
                    totalChapters: book.totalChapters,
                    status: book.status
                },
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Failed to process upload' });
        }
    }
);

// GET /api/books/:id/progress - Get reading progress
router.get('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const progress = await ReadingProgress.findOne({
            userId: req.userId,
            bookId: req.params.id,
        });

        if (!progress) {
            res.json({
                chapterIndex: 0,
                scrollPosition: 0,
                percentage: 0,
            });
            return;
        }

        res.json({
            chapterIndex: progress.chapterIndex,
            scrollPosition: progress.scrollPosition,
            percentage: progress.percentage,
            lastReadAt: progress.lastReadAt,
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// PUT /api/books/:id/progress - Update reading progress
router.put('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { chapterIndex, scrollPosition, percentage } = req.body;

        const progress = await ReadingProgress.findOneAndUpdate(
            { userId: req.userId, bookId: req.params.id },
            {
                chapterIndex: chapterIndex ?? 0,
                scrollPosition: scrollPosition ?? 0,
                percentage: percentage ?? 0,
                lastReadAt: new Date(),
            },
            { upsert: true, new: true }
        );

        res.json({
            chapterIndex: progress.chapterIndex,
            scrollPosition: progress.scrollPosition,
            percentage: progress.percentage,
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// ===== MangaDex Proxy Endpoints =====

// GET /api/books/:id/mangadex-chapters - Fetch chapter list from MangaDex
router.get('/:id/mangadex-chapters', async (req: Request, res: Response) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book || !book.mangadexId) {
            res.status(404).json({ error: 'MangaDex manga not found' });
            return;
        }

        const axios = (await import('axios')).default;

        // Most MangaDex chapters are fan-translated to English
        // Fetch chapters sorted by chapter number
        const response = await axios.get(`https://api.mangadex.org/manga/${book.mangadexId}/feed`, {
            params: {
                'translatedLanguage[]': 'en',
                'order[chapter]': 'asc',
                'limit': 100,
                'offset': Number(req.query.offset) || 0,
                'includes[]': ['scanlation_group'],
            },
            timeout: 15000,
        });

        const chapters = response.data.data.map((ch: any) => ({
            id: ch.id,
            chapter: ch.attributes.chapter || '0',
            title: ch.attributes.title || `Chapter ${ch.attributes.chapter || '?'}`,
            volume: ch.attributes.volume,
            pages: ch.attributes.pages,
            publishAt: ch.attributes.publishAt,
            group: ch.relationships?.find((r: any) => r.type === 'scanlation_group')?.attributes?.name || 'Unknown',
        }));

        res.json({
            chapters,
            total: response.data.total,
            limit: response.data.limit,
            offset: response.data.offset,
        });
    } catch (error) {
        console.error('MangaDex chapters fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch chapters from MangaDex' });
    }
});

// GET /api/books/:id/mangadex-pages/:chapterId - Fetch page URLs for a chapter
router.get('/:id/mangadex-pages/:chapterId', async (req: Request, res: Response) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book || !book.mangadexId) {
            res.status(404).json({ error: 'MangaDex manga not found' });
            return;
        }

        const axios = (await import('axios')).default;

        // Fetch at-home server URL for this chapter
        const atHomeRes = await axios.get(`https://api.mangadex.org/at-home/server/${req.params.chapterId}`, {
            timeout: 15000,
        });

        const { baseUrl, chapter } = atHomeRes.data;

        // Build full image URLs (use data-saver for faster loading)
        const pages = chapter.dataSaver.map((filename: string) =>
            `${baseUrl}/data-saver/${chapter.hash}/${filename}`
        );

        // Also provide high-quality URLs
        const pagesHQ = chapter.data.map((filename: string) =>
            `${baseUrl}/data/${chapter.hash}/${filename}`
        );

        res.json({ pages, pagesHQ, hash: chapter.hash });
    } catch (error) {
        console.error('MangaDex pages fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch pages from MangaDex' });
    }
});

export default router;

import { Router, Request, Response } from 'express';
import { Book } from '../books/book.model';

const router = Router();

// GET /api/search - Global search
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            q,
            contentType,
            language,
            genre,
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        const filter: Record<string, unknown> = { isPublic: true };

        // Text search
        if (q) {
            filter.$text = { $search: q as string };
        }

        // Filters
        if (contentType) filter.contentType = contentType;
        if (language) filter.language = language;
        if (genre) filter.genres = { $in: [genre] };

        const skip = (Number(page) - 1) * Number(limit);

        // Sorting
        let sort: Record<string, 1 | -1 | { $meta: string }> = { createdAt: -1 };
        if (q && sortBy === 'relevance') {
            sort = { score: { $meta: 'textScore' } };
        } else if (sortBy === 'popular') {
            sort = { views: -1 };
        } else if (sortBy === 'likes') {
            sort = { likes: -1 };
        }

        const query = Book.find(filter);

        // Add text score projection for relevance sorting
        if (q) {
            query.select({ score: { $meta: 'textScore' } });
        }

        const [books, total] = await Promise.all([
            query.sort(sort).skip(skip).limit(Number(limit)).lean(),
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
            filters: {
                query: q || null,
                contentType: contentType || null,
                language: language || null,
                genre: genre || null,
            },
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// GET /api/search/suggestions - Autocomplete suggestions
router.get('/suggestions', async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || (q as string).length < 2) {
            res.json({ suggestions: [] });
            return;
        }

        const regex = new RegExp(q as string, 'i');
        const books = await Book.find({
            isPublic: true,
            $or: [
                { title: regex },
                { authorName: regex },
            ],
        })
            .select('title authorName contentType')
            .limit(5)
            .lean();

        const suggestions = books.map((b) => ({
            id: b._id,
            title: b.title,
            author: b.authorName,
            type: b.contentType,
        }));

        res.json({ suggestions });
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});

export default router;

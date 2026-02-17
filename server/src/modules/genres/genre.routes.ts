import { Router, Request, Response } from 'express';
import { Genre } from './genre.model';
import { Book } from '../books/book.model';

const router = Router();

// GET /api/genres - Get all active genres with book counts
router.get('/', async (_req: Request, res: Response) => {
    try {
        const genres = await Genre.find({ isActive: true })
            .sort({ sortOrder: 1, name: 1 })
            .lean();

        res.json({ genres });
    } catch (error) {
        console.error('Get genres error:', error);
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

// GET /api/genres/:slug/books - Get books by genre
router.get('/:slug/books', async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const { page = 1, limit = 20, sortBy = 'recent' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const genre = await Genre.findOne({ slug, isActive: true });
        if (!genre) {
            res.status(404).json({ error: 'Genre not found' });
            return;
        }

        let sort: Record<string, 1 | -1> = { createdAt: -1 };
        if (sortBy === 'popular') sort = { views: -1 };
        if (sortBy === 'likes') sort = { likes: -1 };

        const filter = { genres: slug, isPublic: true, status: 'approved' };

        const [books, total] = await Promise.all([
            Book.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Book.countDocuments(filter),
        ]);

        res.json({
            genre,
            books,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get genre books error:', error);
        res.status(500).json({ error: 'Failed to fetch genre books' });
    }
});

export default router;

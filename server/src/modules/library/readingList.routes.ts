import { Router, Response } from 'express';
import { ReadingList } from './readingList.model';
import { ReadingProgress } from '../books/readingProgress.model';
import { Book } from '../books/book.model';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// All library routes require authentication
// All library routes require authentication
router.use(authenticate);

// GET /api/library - Get user's reading list
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter: Record<string, unknown> = { userId: req.userId };
        if (status) filter.status = status;

        const [items, total] = await Promise.all([
            ReadingList.find(filter)
                .sort({ addedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('bookId', 'title coverUrl contentType authorName views likes totalChapters genres')
                .lean(),
            ReadingList.countDocuments(filter),
        ]);

        // Fetch reading progress for these books
        const bookIds = items.map(item => item.bookId?._id).filter(Boolean);

        const progressList = await ReadingProgress.find({
            userId: req.userId,
            bookId: { $in: bookIds }
        }).lean();

        // Create a map for faster lookup
        const progressMap = new Map();
        progressList.forEach(p => {
            if (p.bookId) {
                const pBookId = p.bookId.toString();
                progressMap.set(pBookId, p);
            }
        });

        // Attach progress to items
        const itemsWithProgress = items.map(item => {
            const bookId = item.bookId?._id.toString();
            return {
                ...item,
                readingProgress: bookId ? progressMap.get(bookId) || null : null
            };
        });

        res.json({
            items: itemsWithProgress,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get library error:', error);
        res.status(500).json({ error: 'Failed to fetch reading list' });
    }
});

// POST /api/library/:bookId - Add book to reading list
router.post('/:bookId', async (req: AuthRequest, res: Response) => {
    try {
        const { bookId } = req.params;
        const { status = 'want_to_read', notes } = req.body;

        // Verify book exists
        const book = await Book.findById(bookId);
        if (!book) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }

        const item = await ReadingList.findOneAndUpdate(
            { userId: req.userId, bookId },
            { userId: req.userId, bookId, status, notes, addedAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({ message: 'Added to library', item });
    } catch (error) {
        console.error('Add to library error:', error);
        res.status(500).json({ error: 'Failed to add to library' });
    }
});

// PATCH /api/library/:bookId - Update status/notes
router.patch('/:bookId', async (req: AuthRequest, res: Response) => {
    try {
        const { status, notes } = req.body;
        const update: Record<string, unknown> = {};
        if (status) update.status = status;
        if (notes !== undefined) update.notes = notes;

        const item = await ReadingList.findOneAndUpdate(
            { userId: req.userId, bookId: req.params.bookId },
            { $set: update },
            { new: true }
        );

        if (!item) {
            res.status(404).json({ error: 'Book not in your library' });
            return;
        }

        res.json({ message: 'Updated', item });
    } catch (error) {
        console.error('Update library error:', error);
        res.status(500).json({ error: 'Failed to update library item' });
    }
});

// DELETE /api/library/:bookId - Remove from reading list
router.delete('/:bookId', async (req: AuthRequest, res: Response) => {
    try {
        const result = await ReadingList.findOneAndDelete({
            userId: req.userId,
            bookId: req.params.bookId,
        });

        if (!result) {
            res.status(404).json({ error: 'Book not in your library' });
            return;
        }

        res.json({ message: 'Removed from library' });
    } catch (error) {
        console.error('Remove from library error:', error);
        res.status(500).json({ error: 'Failed to remove from library' });
    }
});

// GET /api/library/check/:bookId - Check if book is in library
router.get('/check/:bookId', async (req: AuthRequest, res: Response) => {
    try {
        const item = await ReadingList.findOne({
            userId: req.userId,
            bookId: req.params.bookId,
        }).lean();

        res.json({
            inLibrary: !!item,
            status: item?.status || null,
        });
    } catch (error) {
        console.error('Check library error:', error);
        res.status(500).json({ error: 'Failed to check library' });
    }
});

export default router;

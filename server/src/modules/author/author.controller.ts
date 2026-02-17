import { Response } from 'express';
import { Book } from '../books/book.model';
import { Comment } from '../community/comment.model';
import { Review } from '../community/review.model';
import { Chapter } from '../books/chapter.model';
import { AuthRequest } from '../../middleware/auth.middleware';

// GET /api/author/stats
export const getAuthorStats = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.userId;

        const books = await Book.find({ author: authorId }).select('_id views likes').lean();
        const bookIds = books.map(b => b._id);

        const [totalComments, totalReviews] = await Promise.all([
            Comment.countDocuments({ bookId: { $in: bookIds } }),
            Review.countDocuments({ bookId: { $in: bookIds } }),
        ]);

        const totalViews = books.reduce((sum, b) => sum + (b.views || 0), 0);
        const totalLikes = books.reduce((sum, b) => sum + (b.likes || 0), 0);

        res.json({
            totalBooks: books.length,
            totalViews,
            totalLikes,
            totalComments,
            totalReviews,
        });
    } catch (error) {
        console.error('Author stats error:', error);
        res.status(500).json({ error: 'Failed to fetch author stats' });
    }
};

// ... (getAuthorWorks) ...

// GET /api/author/reviews
export const getAuthorReviews = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.userId;
        const { page = '1' } = req.query;
        const limit = 20;
        const skip = (parseInt(page as string) - 1) * limit;

        // Get all author's book IDs
        const books = await Book.find({ author: authorId }).select('_id title').lean();
        const bookIds = books.map(b => b._id);
        const bookTitleMap = new Map(books.map(b => [b._id.toString(), b.title]));

        const [reviews, total] = await Promise.all([
            Review.find({ bookId: { $in: bookIds } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments({ bookId: { $in: bookIds } }),
        ]);

        const result = reviews.map(r => ({
            ...r,
            bookTitle: bookTitleMap.get(r.bookId.toString()) || 'Unknown',
        }));

        res.json({
            reviews: result,
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Author reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

// GET /api/author/works
export const getAuthorWorks = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.userId;

        const books = await Book.find({ author: authorId })
            .sort({ updatedAt: -1 })
            .lean();

        // Get comment counts per book
        const bookIds = books.map(b => b._id);
        const commentCounts = await Comment.aggregate([
            { $match: { bookId: { $in: bookIds } } },
            { $group: { _id: '$bookId', count: { $sum: 1 } } },
        ]);
        const commentMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));

        const result = books.map(b => ({
            ...b,
            commentCount: commentMap.get(b._id.toString()) || 0,
        }));

        res.json({ works: result });
    } catch (error) {
        console.error('Author works error:', error);
        res.status(500).json({ error: 'Failed to fetch author works' });
    }
};

// GET /api/author/comments
export const getAuthorComments = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.userId;
        const { page = '1' } = req.query;
        const limit = 20;
        const skip = (parseInt(page as string) - 1) * limit;

        // Get all author's book IDs
        const books = await Book.find({ author: authorId }).select('_id title').lean();
        const bookIds = books.map(b => b._id);
        const bookTitleMap = new Map(books.map(b => [b._id.toString(), b.title]));

        const [comments, total] = await Promise.all([
            Comment.find({ bookId: { $in: bookIds } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments({ bookId: { $in: bookIds } }),
        ]);

        const result = comments.map(c => ({
            ...c,
            bookTitle: bookTitleMap.get(c.bookId.toString()) || 'Unknown',
        }));

        res.json({
            comments: result,
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Author comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// DELETE /api/author/books/:id
export const deleteAuthorBook = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.userId;
        const book = await Book.findById(req.params.id);

        if (!book) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }

        if (book.author?.toString() !== authorId) {
            res.status(403).json({ error: 'You can only delete your own books' });
            return;
        }

        // Delete chapters, comments, and the book itself
        await Promise.all([
            Chapter.deleteMany({ bookId: book._id }),
            Comment.deleteMany({ bookId: book._id }),
            Book.deleteOne({ _id: book._id }),
        ]);

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
};

// PUT /api/author/books/:id - Update book details
export const updateAuthorBook = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.userId;
        const book = await Book.findById(req.params.id);

        if (!book) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }

        if (book.author?.toString() !== authorId) {
            res.status(403).json({ error: 'You can only edit your own books' });
            return;
        }

        const allowedFields = ['title', 'description', 'genres', 'language'];
        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const updated = await Book.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).lean();

        res.json({ message: 'Book updated successfully', book: updated });
    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({ error: 'Failed to update book' });
    }
};

// PATCH /api/author/books/:id/publish - Toggle publish status
export const toggleBookPublish = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.userId;
        const book = await Book.findById(req.params.id);

        if (!book) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }

        if (book.author?.toString() !== authorId) {
            res.status(403).json({ error: 'You can only manage your own books' });
            return;
        }

        book.isPublic = !book.isPublic;
        await book.save();

        res.json({
            message: book.isPublic ? 'Book published' : 'Book unpublished',
            isPublic: book.isPublic,
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({ error: 'Failed to toggle publish status' });
    }
};

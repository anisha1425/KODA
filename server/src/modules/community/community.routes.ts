import { Router, Response } from 'express';
import { z } from 'zod';
import mongoose, { Types } from 'mongoose';
import { Comment } from './comment.model';
import { Like } from './like.model';
import { Review } from './review.model';
import { Book } from '../books/book.model';
import { Report } from '../admin/report.model';
import { authenticate, AuthRequest, optionalAuth } from '../../middleware/auth.middleware';
import { createNotification } from '../notifications/notification.service';

const router = Router();

// Validation schemas
const createCommentSchema = z.object({
    content: z.string().min(1).max(1000),
    parentId: z.string().optional(),
});

const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    content: z.string().max(2000).optional(),
});

// GET /api/books/:bookId/comments - Get comments for a book
router.get('/books/:bookId/comments', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { bookId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const comments = await Comment.find({ bookId, parentId: null })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({ parentId: comment._id })
                    .sort({ createdAt: 1 })
                    .limit(3)
                    .lean();

                // Check if user liked this comment
                let isLiked = false;
                if (req.userId) {
                    const like = await Like.findOne({
                        userId: req.userId,
                        targetType: 'comment',
                        targetId: comment._id,
                    });
                    isLiked = !!like;
                }

                return { ...comment, replies, isLiked };
            })
        );

        const total = await Comment.countDocuments({ bookId, parentId: null });

        res.json({
            comments: commentsWithReplies,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/books/:bookId/comments - Create a comment
router.post('/books/:bookId/comments', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { bookId } = req.params;
        const validation = createCommentSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        const comment = await Comment.create({
            bookId,
            userId: req.userId,
            userName: req.user!.displayName,
            userAvatar: req.user!.avatarUrl,
            content: validation.data.content,
            parentId: validation.data.parentId,
        });

        // Fire notifications
        if (validation.data.parentId) {
            // Reply → notify original commenter
            const parent = await Comment.findById(validation.data.parentId);
            if (parent) {
                createNotification({
                    userId: parent.userId.toString(),
                    type: 'comment_reply',
                    title: 'New Reply',
                    message: `${req.user!.displayName} replied to your comment`,
                    sourceUserId: req.userId,
                    targetType: 'comment',
                    targetId: parent._id.toString(),
                });
            }
        } else {
            // Top-level comment → notify book author
            const book = await Book.findById(bookId);
            if (book?.author) {
                createNotification({
                    userId: book.author.toString(),
                    type: 'comment_reply',
                    title: 'New Comment',
                    message: `${req.user!.displayName} commented on "${book.title}"`,
                    sourceUserId: req.userId,
                    targetType: 'book',
                    targetId: bookId as string,
                });
            }
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// DELETE /api/comments/:id - Delete a comment
router.delete('/comments/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        if (comment.userId.toString() !== req.userId) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        await Comment.deleteOne({ _id: req.params.id });
        // Also delete replies
        await Comment.deleteMany({ parentId: req.params.id });

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// ─── REVIEWS ────────────────────────────────────────────────────

// GET /api/books/:bookId/reviews - Get reviews for a book
router.get('/books/:bookId/reviews', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { bookId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const reviews = await Review.find({ bookId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await Review.countDocuments({ bookId });

        const reviewsWithOwnership = reviews.map((review) => ({
            ...review,
            isOwn: req.userId ? review.userId.toString() === req.userId : false,
        }));

        res.json({
            reviews: reviewsWithOwnership,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// POST /api/books/:bookId/reviews - Create or update a review
router.post('/books/:bookId/reviews', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { bookId } = req.params;
        const validation = createReviewSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        // Upsert: update if exists, create if not
        const review = await Review.findOneAndUpdate(
            { bookId, userId: req.userId },
            {
                bookId,
                userId: req.userId,
                userName: req.user!.displayName,
                userAvatar: req.user!.avatarUrl,
                rating: validation.data.rating,
                content: validation.data.content,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Notify book author about the review
        const book = await Book.findById(bookId);
        if (book?.author) {
            createNotification({
                userId: book.author.toString(),
                type: 'review',
                title: 'New Review',
                message: `${req.user!.displayName} gave "${book.title}" ${validation.data.rating} stars`,
                sourceUserId: req.userId,
                targetType: 'book',
                targetId: bookId as string,
            });
        }

        res.status(201).json(review);
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

// DELETE /api/reviews/:id - Delete own review
router.delete('/reviews/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        if (review.userId.toString() !== req.userId) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        await Review.deleteOne({ _id: req.params.id });
        res.json({ message: 'Review deleted' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// GET /api/books/:bookId/rating - Get average rating + count
router.get('/books/:bookId/rating', async (req: AuthRequest, res: Response) => {
    try {
        const { bookId } = req.params;

        const result = await Review.aggregate([
            { $match: { bookId: new Types.ObjectId(bookId as string) } },
            { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);

        if (result.length === 0) {
            res.json({ average: 0, count: 0 });
            return;
        }

        res.json({
            average: Math.round(result[0].average * 10) / 10,
            count: result[0].count,
        });
    } catch (error) {
        console.error('Get rating error:', error);
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
});

// ─── LIKES ──────────────────────────────────────────────────────

// POST /api/likes - Toggle like
router.post('/likes', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { targetType, targetId } = req.body;

        if (!['book', 'comment'].includes(targetType)) {
            res.status(400).json({ error: 'Invalid target type' });
            return;
        }

        const existingLike = await Like.findOne({
            userId: req.userId,
            targetType,
            targetId,
        });

        if (existingLike) {
            // Unlike
            await Like.deleteOne({ _id: existingLike._id });

            // Decrement like count
            if (targetType === 'book') {
                await Book.findByIdAndUpdate(targetId, { $inc: { likes: -1 } });
            } else {
                await Comment.findByIdAndUpdate(targetId, { $inc: { likes: -1 } });
            }

            const newCount = targetType === 'book'
                ? (await Book.findById(targetId).select('likes').lean())?.likes ?? 0
                : (await Comment.findById(targetId).select('likes').lean())?.likes ?? 0;

            res.json({ liked: false, count: newCount });
        } else {
            // Like
            await Like.create({ userId: req.userId, targetType, targetId });

            // Increment like count
            if (targetType === 'book') {
                await Book.findByIdAndUpdate(targetId, { $inc: { likes: 1 } });
                // Notify book author
                const book = await Book.findById(targetId);
                if (book?.author) {
                    createNotification({
                        userId: book.author.toString(),
                        type: 'like',
                        title: 'New Like',
                        message: `${req.user!.displayName} liked "${book.title}"`,
                        sourceUserId: req.userId,
                        targetType: 'book',
                        targetId,
                    });
                }
            } else {
                await Comment.findByIdAndUpdate(targetId, { $inc: { likes: 1 } });
                // Notify comment author
                const comment = await Comment.findById(targetId);
                if (comment) {
                    createNotification({
                        userId: comment.userId.toString(),
                        type: 'like',
                        title: 'Comment Liked',
                        message: `${req.user!.displayName} liked your comment`,
                        sourceUserId: req.userId,
                        targetType: 'comment',
                        targetId,
                    });
                }
            }

            const newCount = targetType === 'book'
                ? (await Book.findById(targetId).select('likes').lean())?.likes ?? 0
                : (await Comment.findById(targetId).select('likes').lean())?.likes ?? 0;

            res.json({ liked: true, count: newCount });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// GET /api/likes/check - Check if user liked items
router.get('/likes/check', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { targetType, targetIds } = req.query;

        if (!targetType || !targetIds) {
            res.status(400).json({ error: 'Missing parameters' });
            return;
        }

        const ids = (targetIds as string).split(',');
        const likes = await Like.find({
            userId: req.userId,
            targetType,
            targetId: { $in: ids },
        });

        const likedIds = likes.map((l) => l.targetId.toString());
        res.json({ likedIds });
    } catch (error) {
        console.error('Check likes error:', error);
        res.status(500).json({ error: 'Failed to check likes' });
    }
});

// ─── REPORTS ────────────────────────────────────────────────────

const createReportSchema = z.object({
    targetType: z.enum(['book', 'comment', 'user']),
    targetId: z.string().min(1),
    reason: z.string().min(5).max(500),
    description: z.string().max(1000).optional(),
});

// POST /api/reports - Create a report
router.post('/reports', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const validation = createReportSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.issues[0].message });
            return;
        }

        // Check if already reported
        const existing = await Report.findOne({
            reportedBy: req.userId,
            targetType: validation.data.targetType,
            targetId: validation.data.targetId,
        });

        if (existing) {
            res.status(409).json({ error: 'You have already reported this item' });
            return;
        }

        const report = await Report.create({
            reportedBy: req.userId,
            targetType: validation.data.targetType,
            targetId: validation.data.targetId,
            reason: validation.data.reason,
            description: validation.data.description,
        });

        res.status(201).json({ message: 'Report submitted', report });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

export default router;

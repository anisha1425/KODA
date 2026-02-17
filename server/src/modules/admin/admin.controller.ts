import { Request, Response } from 'express';
import { Book } from '../books/book.model';
import { Report } from './report.model';
import { User } from '../users/user.model';
import { Comment } from '../community/comment.model';
import { Notification } from '../notifications/notification.model';

// GET /api/admin/stats
export const getAdminStats = async (_req: Request, res: Response) => {
    try {
        const [pendingBooks, pendingReports, approvedToday, totalUsers, totalAuthors] = await Promise.all([
            Book.countDocuments({ status: 'pending' }),
            Report.countDocuments({ status: 'pending' }),
            Book.countDocuments({
                status: 'approved',
                updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            }),
            User.countDocuments(),
            User.countDocuments({ role: 'author' }),
        ]);

        res.json({
            pendingReviews: pendingBooks,
            reportedItems: pendingReports,
            approvedToday,
            totalUsers,
            totalAuthors,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// GET /api/admin/content-queue
export const getContentQueue = async (req: Request, res: Response) => {
    try {
        const { language, sort = 'oldest', page = '1' } = req.query;
        const limit = 20;
        const skip = (parseInt(page as string) - 1) * limit;

        const filter: Record<string, unknown> = { status: 'pending' };
        if (language) filter.language = language;

        const sortOrder = sort === 'newest' ? -1 : 1;

        const [books, total] = await Promise.all([
            Book.find(filter)
                .sort({ createdAt: sortOrder })
                .skip(skip)
                .limit(limit)
                .populate('author', 'displayName email')
                .lean(),
            Book.countDocuments(filter),
        ]);

        res.json({ books, total, page: parseInt(page as string), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Content queue error:', error);
        res.status(500).json({ error: 'Failed to fetch content queue' });
    }
};

// PATCH /api/admin/content/:bookId/approve
export const approveBook = async (req: Request, res: Response) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.bookId,
            { status: 'approved' },
            { new: true }
        );
        if (!book) { res.status(404).json({ error: 'Book not found' }); return; }

        // Create notification for the author
        if (book.author) {
            await Notification.create({
                userId: book.author,
                type: 'book_approved',
                title: 'Book Approved',
                message: `Your book "${book.title}" has been approved and is now public.`,
                targetType: 'book',
                targetId: book._id
            });
        }

        res.json({ message: 'Book approved', book });
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ error: 'Failed to approve book' });
    }
};

// PATCH /api/admin/content/:bookId/reject
export const rejectBook = async (req: Request, res: Response) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.bookId,
            { status: 'rejected' },
            { new: true }
        );
        if (!book) { res.status(404).json({ error: 'Book not found' }); return; }
        res.json({ message: 'Book rejected', book });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ error: 'Failed to reject book' });
    }
};

// PATCH /api/admin/content/:bookId/flag
export const flagBook = async (req: Request, res: Response) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.bookId,
            { status: 'flagged' },
            { new: true }
        );
        if (!book) { res.status(404).json({ error: 'Book not found' }); return; }
        res.json({ message: 'Book flagged', book });
    } catch (error) {
        console.error('Flag error:', error);
        res.status(500).json({ error: 'Failed to flag book' });
    }
};

// GET /api/admin/reports
export const getReports = async (req: Request, res: Response) => {
    try {
        const { status = 'pending', page = '1' } = req.query;
        const limit = 20;
        const skip = (parseInt(page as string) - 1) * limit;

        const [reports, total] = await Promise.all([
            Report.find({ status })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('reportedBy', 'displayName email avatarUrl')
                .lean(),
            Report.countDocuments({ status }),
        ]);

        res.json({ reports, total, page: parseInt(page as string), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

// PATCH /api/admin/reports/:id/review
export const reviewReport = async (req: Request, res: Response) => {
    try {
        const { action, adminNote } = req.body; // action: 'reviewed' | 'dismissed'
        if (!['reviewed', 'dismissed'].includes(action)) {
            res.status(400).json({ error: 'Action must be "reviewed" or "dismissed"' });
            return;
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status: action, adminNote },
            { new: true }
        );
        if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
        res.json({ message: `Report ${action}`, report });
    } catch (error) {
        console.error('Review report error:', error);
        res.status(500).json({ error: 'Failed to review report' });
    }
};

// GET /api/admin/authors
export const getAuthors = async (_req: Request, res: Response) => {
    try {
        const authors = await User.find({ role: 'author' })
            .select('displayName email avatarUrl createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // Get book counts for each author
        const authorIds = authors.map(a => a._id);
        const bookCounts = await Book.aggregate([
            { $match: { author: { $in: authorIds } } },
            { $group: { _id: '$author', count: { $sum: 1 } } },
        ]);
        const countMap = new Map(bookCounts.map(b => [b._id.toString(), b.count]));

        const result = authors.map(a => ({
            ...a,
            bookCount: countMap.get(a._id.toString()) || 0,
        }));

        res.json({ authors: result });
    } catch (error) {
        console.error('Authors error:', error);
        res.status(500).json({ error: 'Failed to fetch authors' });
    }
};

// GET /api/admin/users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = '1', role } = req.query;
        const limit = 20;
        const skip = (parseInt(page as string) - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (role) filter.role = role;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('displayName email role avatarUrl createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        res.json({ users, total, page: parseInt(page as string), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { role } = req.body;
        if (!['reader', 'author', 'admin'].includes(role)) {
            res.status(400).json({ error: 'Role must be "reader", "author", or "admin"' });
            return;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('displayName email role avatarUrl createdAt');

        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        res.json({ message: `Role updated to ${role}`, user });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

import { Router, Response } from 'express';
import { Notification } from './notification.model';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user notifications (paginated)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [notifications, total] = await Promise.all([
            Notification.find({ userId: req.userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('sourceUser', 'displayName avatarUrl')
                .lean(),
            Notification.countDocuments({ userId: req.userId }),
        ]);

        res.json({
            notifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.userId,
            isRead: false,
        });
        res.json({ count });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.json({ message: 'Marked as read', notification });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

export default router;

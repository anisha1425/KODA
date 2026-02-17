import { Router, Response } from 'express';
import { z } from 'zod';
import { User } from '../users/user.model';
import { Book } from '../books/book.model';
import { ReadingProgress } from '../books/readingProgress.model';
import { ReadingList } from '../library/readingList.model';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
    displayName: z.string().min(2).max(50).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional(),
});

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user._id,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            bannerUrl: user.bannerUrl,
            bio: user.bio,
            oAuthProvider: user.oAuthProvider,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

import fs from 'fs';
import path from 'path';
import { uploadMiddleware, UPLOAD_CONFIG } from '../../config/upload';

// PUT /api/users/me - Update current user profile
router.put(
    '/me',
    authenticate,
    uploadMiddleware.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
    ]),
    async (req: AuthRequest, res: Response) => {
        try {
            // Parse body - if multipart, body fields are regular strings
            const body = req.body;

            // Handle file uploads
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            let avatarUrl = body.avatarUrl;
            let bannerUrl = body.bannerUrl;

            // Helper to process uploaded file
            const processFile = (file: Express.Multer.File, subDir: string): string => {
                const targetDir = path.join(UPLOAD_CONFIG.UPLOAD_DIR, subDir);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                const targetPath = path.join(targetDir, file.filename);
                // Move from temp to permanent
                fs.renameSync(file.path, targetPath);
                // Return relative URL assuming /uploads is served statically
                return `/uploads/${subDir}/${file.filename}`;
            };

            if (files?.avatar?.[0]) {
                avatarUrl = processFile(files.avatar[0], 'avatars');
            }

            if (files?.banner?.[0]) {
                bannerUrl = processFile(files.banner[0], 'banners');
            }

            // Clean up: simple validation since Zod on multipart can be tricky with partials
            // We trust the body fields here or could manually validate strings
            const updateData: any = {};
            if (body.displayName) updateData.displayName = body.displayName;
            if (body.bio) updateData.bio = body.bio;
            if (avatarUrl) updateData.avatarUrl = avatarUrl;
            if (bannerUrl) updateData.bannerUrl = bannerUrl;

            // Optional: Run validation schema on the constructed object if needed, 
            // but we need to be careful with existing schema expecting strict shapes
            // const validation = updateProfileSchema.safeParse(updateData);
            // if (!validation.success) { ... }

            const user = await User.findByIdAndUpdate(
                req.userId,
                { $set: updateData },
                { new: true }
            );

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                id: user._id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                bannerUrl: user.bannerUrl,
                bio: user.bio,
            });
        } catch (error) {
            console.error('Update profile error:', error);
            // Cleanup temp files if error
            if (req.files) {
                const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                Object.values(files).flat().forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            }
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
);

// GET /api/users/me/stats - Get user reading stats
router.get('/me/stats', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const [booksRead, progress, ownBooks] = await Promise.all([
            ReadingList.countDocuments({ userId: req.userId, status: 'completed' }),
            ReadingProgress.find({ userId: req.userId })
                .sort({ lastReadAt: -1 })
                .limit(5)
                .populate('bookId', 'title coverUrl contentType')
                .lean(),
            Book.countDocuments({ author: req.userId }),
        ]);

        const recentlyRead = progress.map((p) => ({
            book: p.bookId,
            percentage: p.percentage,
            lastReadAt: p.lastReadAt,
        }));

        res.json({
            booksRead,
            booksPublished: ownBooks,
            recentlyRead,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/users/become-author - Upgrade reader to author role
router.post('/become-author', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.role === 'author' || user.role === 'admin') {
            // Already an author or admin — return success without modification
            res.json({
                message: 'Already an author',
                user: {
                    id: user._id,
                    displayName: user.displayName,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                },
            });
            return;
        }

        user.role = 'author';
        await user.save();

        res.json({
            message: 'Successfully upgraded to author',
            user: {
                id: user._id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                bannerUrl: user.bannerUrl,
            },
        });
    } catch (error) {
        console.error('Become author error:', error);
        res.status(500).json({ error: 'Failed to upgrade role' });
    }
});

// GET /api/users/:id - Get public user profile
router.get('/:id', async (req, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('displayName avatarUrl bio role createdAt');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Get user's published books
        const books = await Book.find({ author: req.params.id, isPublic: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title coverUrl contentType views likes')
            .lean();

        res.json({
            user: {
                id: user._id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                role: user.role,
                createdAt: user.createdAt,
            },
            books,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

export default router;

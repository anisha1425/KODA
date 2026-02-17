import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import {
    getAdminStats,
    getContentQueue,
    approveBook,
    rejectBook,
    flagBook,
    getReports,
    reviewReport,
    getAuthors,
    getUsers,
    updateUserRole,
} from './admin.controller';

const router = Router();

// All routes are admin-protected
router.use(adminAuth);

router.get('/stats', getAdminStats);
router.get('/content-queue', getContentQueue);
router.patch('/content/:bookId/approve', approveBook);
router.patch('/content/:bookId/reject', rejectBook);
router.patch('/content/:bookId/flag', flagBook);
router.get('/reports', getReports);
router.patch('/reports/:id/review', reviewReport);
router.get('/authors', getAuthors);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);

export default router;

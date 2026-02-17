import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import {
    getAuthorStats,
    getAuthorWorks,
    getAuthorComments,
    getAuthorReviews,
    deleteAuthorBook,
    updateAuthorBook,
    toggleBookPublish,
} from './author.controller';

const router = Router();

// All routes require author or admin role
router.use(authenticate, requireRole('author', 'admin'));

router.get('/stats', getAuthorStats);
router.get('/works', getAuthorWorks);
router.get('/comments', getAuthorComments);
router.get('/reviews', getAuthorReviews);
router.put('/books/:id', updateAuthorBook);
router.patch('/books/:id/publish', toggleBookPublish);
router.delete('/books/:id', deleteAuthorBook);

export default router;

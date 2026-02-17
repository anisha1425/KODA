import { Router, Request, Response } from 'express';
import { importGutenbergBooks } from './gutenberg.service';
import { importArchiveComics } from './archive.service';

const router = Router();

// Admin-only middleware (check if user is admin)
const requireAdmin = (req: Request, res: Response, next: Function) => {
    // @ts-ignore - user attached by auth middleware
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Import status tracking
let importStatus = {
    isRunning: false,
    type: '',
    imported: 0,
    skipped: 0,
    errors: 0,
    startedAt: null as Date | null,
};

/**
 * POST /api/import/gutenberg
 * Import books from Project Gutenberg
 * Admin only
 */
router.post('/gutenberg', requireAdmin, async (req: Request, res: Response) => {
    if (importStatus.isRunning) {
        return res.status(409).json({ error: 'Import already in progress', status: importStatus });
    }

    const { limit = 500, languages } = req.body;

    // Start async import
    importStatus = {
        isRunning: true,
        type: 'gutenberg',
        imported: 0,
        skipped: 0,
        errors: 0,
        startedAt: new Date(),
    };

    res.json({
        message: `Starting Gutenberg import (limit: ${limit})`,
        status: importStatus,
    });

    // Run import in background
    try {
        const result = await importGutenbergBooks(limit, languages);
        importStatus = {
            ...importStatus,
            isRunning: false,
            ...result,
        };
    } catch (err) {
        importStatus.isRunning = false;
        importStatus.errors++;
    }
});

/**
 * POST /api/import/comics
 * Import comics from Internet Archive
 * Admin only
 */
router.post('/comics', requireAdmin, async (req: Request, res: Response) => {
    if (importStatus.isRunning) {
        return res.status(409).json({ error: 'Import already in progress', status: importStatus });
    }

    const { limit = 100 } = req.body;

    // Start async import
    importStatus = {
        isRunning: true,
        type: 'internet_archive',
        imported: 0,
        skipped: 0,
        errors: 0,
        startedAt: new Date(),
    };

    res.json({
        message: `Starting Internet Archive comics import (limit: ${limit})`,
        status: importStatus,
    });

    // Run import in background
    try {
        const result = await importArchiveComics(limit);
        importStatus = {
            ...importStatus,
            isRunning: false,
            ...result,
        };
    } catch (err) {
        importStatus.isRunning = false;
        importStatus.errors++;
    }
});

/**
 * GET /api/import/status
 * Check import status
 * Admin only
 */
router.get('/status', requireAdmin, (req: Request, res: Response) => {
    res.json(importStatus);
});

export default router;

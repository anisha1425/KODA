import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');

// Ensure upload directories exist
[UPLOAD_DIR, TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Allowed file types
const ALLOWED_TYPES = {
    novel: ['.epub'],
    comic: ['.cbz', '.cbr', '.zip'],
    image: ['.jpg', '.jpeg', '.png', '.webp'],
};

// File filter
const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allAllowed = [...ALLOWED_TYPES.novel, ...ALLOWED_TYPES.comic, ...ALLOWED_TYPES.image];

    if (allAllowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed: ${allAllowed.join(', ')}`));
    }
};

// Storage configuration
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, TEMP_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

// Export configured multer
export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
});

export const UPLOAD_CONFIG = {
    UPLOAD_DIR,
    TEMP_DIR,
    ALLOWED_TYPES,
};

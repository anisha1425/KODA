import { z } from 'zod';

// ============ BOOK SCHEMAS ============

export const contentTypeSchema = z.enum(['novel', 'comic']);
export type ContentType = z.infer<typeof contentTypeSchema>;

export const languageSchema = z.enum([
    'en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'hi', 'pt', 'ru', 'ar', 'other'
]);
export type Language = z.infer<typeof languageSchema>;

export const genreSchema = z.enum([
    'fantasy', 'sci-fi', 'romance', 'mystery', 'thriller', 'horror',
    'action', 'adventure', 'comedy', 'drama', 'slice-of-life', 'other'
]);
export type Genre = z.infer<typeof genreSchema>;

export const bookSchema = z.object({
    _id: z.string(),
    title: z.string().min(1).max(200),
    author: z.string(), // User ID
    authorName: z.string(),
    description: z.string().max(2000).optional(),
    coverUrl: z.string().url().optional(),
    fileUrl: z.string().url(),
    contentType: contentTypeSchema,
    language: languageSchema.default('en'),
    genres: z.array(genreSchema).max(3).default([]),
    totalChapters: z.number().int().min(1).default(1),
    isPublic: z.boolean().default(true),
    likes: z.number().int().default(0),
    views: z.number().int().default(0),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
export type Book = z.infer<typeof bookSchema>;

export const createBookSchema = bookSchema.omit({
    _id: true,
    authorName: true,
    likes: true,
    views: true,
    createdAt: true,
    updatedAt: true,
});
export type CreateBookInput = z.infer<typeof createBookSchema>;

// ============ CHAPTER SCHEMAS ============

export const chapterSchema = z.object({
    _id: z.string(),
    bookId: z.string(),
    title: z.string().max(200).optional(),
    content: z.string(), // HTML for novels, Image URL(s) for comics
    orderIndex: z.number().int().min(0),
    createdAt: z.coerce.date(),
});
export type Chapter = z.infer<typeof chapterSchema>;

// ============ READING PROGRESS SCHEMAS ============

export const readingProgressSchema = z.object({
    _id: z.string(),
    userId: z.string(),
    bookId: z.string(),
    currentChapter: z.number().int().min(0).default(0),
    scrollPosition: z.number().min(0).default(0),
    percentComplete: z.number().min(0).max(100).default(0),
    lastReadAt: z.coerce.date(),
});
export type ReadingProgress = z.infer<typeof readingProgressSchema>;

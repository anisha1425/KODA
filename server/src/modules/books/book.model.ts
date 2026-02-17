import mongoose, { Schema, Document } from 'mongoose';

export type ContentType = 'novel' | 'comic';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh' | 'hi' | 'pt' | 'ru' | 'ar' | 'other';
export type Genre = 'fantasy' | 'sci-fi' | 'romance' | 'mystery' | 'thriller' | 'horror' | 'action' | 'adventure' | 'comedy' | 'drama' | 'slice-of-life' | 'other';
export type BookSource = 'user' | 'gutenberg' | 'internet_archive';
export type BookFormat = 'epub' | 'pdf' | 'cbz' | 'cbr' | 'txt';

export interface IBook extends Document {
    title: string;
    author: mongoose.Types.ObjectId | null;
    authorName: string;
    description?: string;
    coverUrl?: string;
    fileUrl: string;
    contentType: ContentType;
    language: Language;
    genres: Genre[];
    totalChapters: number;
    isPublic: boolean;
    likes: number;
    views: number;
    // External source fields
    source: BookSource;
    gutenbergId?: number;
    archiveId?: string;
    externalUrl?: string;
    format?: BookFormat;
    subjects?: string[];
    translationGroupId?: mongoose.Types.ObjectId; // For linking translations
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    createdAt: Date;
    updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null, // null for imported books
        },
        authorName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
        },
        coverUrl: {
            type: String,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            enum: ['novel', 'comic'],
            required: true,
        },
        language: {
            type: String,
            enum: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'hi', 'pt', 'ru', 'ar', 'other'],
            default: 'en',
        },
        genres: {
            type: [String],
            enum: ['fantasy', 'sci-fi', 'romance', 'mystery', 'thriller', 'horror', 'action', 'adventure', 'comedy', 'drama', 'slice-of-life', 'historical', 'non-fiction', 'other'],
            default: [],
        },
        totalChapters: {
            type: Number,
            default: 0,
            min: 0, // 0 = lazy loading (content not yet fetched)
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        likes: {
            type: Number,
            default: 0,
        },
        views: {
            type: Number,
            default: 0,
        },
        // External source fields
        source: {
            type: String,
            enum: ['user', 'gutenberg', 'internet_archive'],
            default: 'user',
        },
        gutenbergId: {
            type: Number,
        },
        archiveId: {
            type: String,
        },
        externalUrl: {
            type: String,
        },
        format: {
            type: String,
            enum: ['epub', 'pdf', 'cbz', 'cbr', 'txt'],
        },
        subjects: {
            type: [String],
            default: [],
        },
        translationGroupId: {
            type: Schema.Types.ObjectId,
            ref: 'Book', // Or could be a separate Group model, but self-ref is simpler for now
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'flagged'],
            default: 'approved',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for search
// language_override: 'none' prevents MongoDB from using the 'language' field to determine the stemming language
bookSchema.index({ title: 'text', authorName: 'text', description: 'text' }, { language_override: 'none' });
bookSchema.index({ contentType: 1, language: 1, genres: 1 });
bookSchema.index({ source: 1 });
bookSchema.index({ gutenbergId: 1 }, { sparse: true });
bookSchema.index({ archiveId: 1 }, { sparse: true });

// Performance indexes for homepage and sorting
bookSchema.index({ isPublic: 1, createdAt: -1 });  // New releases
bookSchema.index({ isPublic: 1, views: -1 });       // Trending
bookSchema.index({ isPublic: 1, likes: -1 });       // Top rated
bookSchema.index({ status: 1, createdAt: 1 });      // Admin queue
bookSchema.index({ author: 1 });                    // Author works queries

export const Book = mongoose.model<IBook>('Book', bookSchema);

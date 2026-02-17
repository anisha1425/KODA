import mongoose, { Schema, Document } from 'mongoose';

export interface IReadingProgress extends Document {
    userId: mongoose.Types.ObjectId;
    bookId: mongoose.Types.ObjectId;
    chapterIndex: number;
    scrollPosition: number;
    percentage: number;
    lastReadAt: Date;
}

const readingProgressSchema = new Schema<IReadingProgress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        bookId: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
            index: true,
        },
        chapterIndex: {
            type: Number,
            default: 0,
            min: 0,
        },
        scrollPosition: {
            type: Number,
            default: 0,
            min: 0,
        },
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        lastReadAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index - one progress per user per book
readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const ReadingProgress = mongoose.model<IReadingProgress>('ReadingProgress', readingProgressSchema);

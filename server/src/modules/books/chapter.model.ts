import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter extends Document {
    bookId: mongoose.Types.ObjectId;
    title?: string;
    content: string; // HTML for novels, comma-separated image URLs for comics
    orderIndex: number;
    createdAt: Date;
}

const chapterSchema = new Schema<IChapter>(
    {
        bookId: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
            index: true,
        },
        title: {
            type: String,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        content: {
            type: String,
            required: true,
        },
        orderIndex: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient chapter fetching
chapterSchema.index({ bookId: 1, orderIndex: 1 });

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema);

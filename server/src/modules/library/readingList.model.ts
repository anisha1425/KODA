import mongoose, { Schema, Document } from 'mongoose';

export type ReadingStatus = 'want_to_read' | 'reading' | 'completed' | 'dropped';

export interface IReadingList extends Document {
    userId: mongoose.Types.ObjectId;
    bookId: mongoose.Types.ObjectId;
    status: ReadingStatus;
    notes?: string;
    addedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const readingListSchema = new Schema<IReadingList>(
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
        },
        status: {
            type: String,
            enum: ['want_to_read', 'reading', 'completed', 'dropped'],
            default: 'want_to_read',
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// One entry per user per book
readingListSchema.index({ userId: 1, bookId: 1 }, { unique: true });
// Filter by status
readingListSchema.index({ userId: 1, status: 1 });

export const ReadingList = mongoose.model<IReadingList>('ReadingList', readingListSchema);

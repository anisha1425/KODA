import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    bookId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userAvatar?: string;
    rating: number;
    content?: string;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        bookId: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userAvatar: {
            type: String,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        content: {
            type: String,
            maxlength: [2000, 'Review cannot exceed 2000 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// One review per user per book
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });
// Fetch reviews by book
reviewSchema.index({ bookId: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);

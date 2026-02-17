import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
    bookId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userAvatar?: string;
    content: string;
    parentId?: mongoose.Types.ObjectId; // For replies
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        bookId: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
            index: true,
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
        content: {
            type: String,
            required: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
        },
        likes: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fetching comments by book
commentSchema.index({ bookId: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);

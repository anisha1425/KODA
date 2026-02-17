import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
    | 'comment_reply'
    | 'like'
    | 'review'
    | 'book_approved'
    | 'book_rejected'
    | 'role_change'
    | 'system';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    sourceUser?: mongoose.Types.ObjectId;
    targetType?: 'book' | 'comment' | 'review';
    targetId?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['comment_reply', 'like', 'review', 'book_approved', 'book_rejected', 'role_change', 'system'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        message: {
            type: String,
            required: true,
            maxlength: [500, 'Message cannot exceed 500 characters'],
        },
        sourceUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        targetType: {
            type: String,
            enum: ['book', 'comment', 'review'],
        },
        targetId: {
            type: Schema.Types.ObjectId,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Fetch unread notifications efficiently
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

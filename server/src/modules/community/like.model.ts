import mongoose, { Schema, Document } from 'mongoose';

export type LikeTargetType = 'book' | 'comment';

export interface ILike extends Document {
    userId: mongoose.Types.ObjectId;
    targetType: LikeTargetType;
    targetId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const likeSchema = new Schema<ILike>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetType: {
            type: String,
            enum: ['book', 'comment'],
            required: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Unique index - one like per user per target
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
// Index for counting likes
likeSchema.index({ targetType: 1, targetId: 1 });

export const Like = mongoose.model<ILike>('Like', likeSchema);

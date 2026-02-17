import mongoose, { Schema, Document } from 'mongoose';

export type ActivityAction = 'view_book' | 'search' | 'read_chapter' | 'login' | 'register' | 'upload_book';

export interface IActivityLog extends Document {
    userId?: mongoose.Types.ObjectId;
    action: ActivityAction;
    targetType?: 'book' | 'chapter' | 'search';
    targetId?: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        action: {
            type: String,
            enum: ['view_book', 'search', 'read_chapter', 'login', 'register', 'upload_book'],
            required: true,
        },
        targetType: {
            type: String,
            enum: ['book', 'chapter', 'search'],
        },
        targetId: {
            type: Schema.Types.ObjectId,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Query by user + action
activityLogSchema.index({ userId: 1, action: 1 });
// Auto-delete logs after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

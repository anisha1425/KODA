import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    reportedBy: mongoose.Types.ObjectId;
    targetType: 'book' | 'comment' | 'user';
    targetId: mongoose.Types.ObjectId;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'dismissed';
    adminNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
    {
        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetType: {
            type: String,
            enum: ['book', 'comment', 'user'],
            required: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            maxlength: [500, 'Reason cannot exceed 500 characters'],
        },
        description: {
            type: String,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'dismissed'],
            default: 'pending',
        },
        adminNote: {
            type: String,
            maxlength: [500, 'Note cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);

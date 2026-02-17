import { Notification, NotificationType } from './notification.model';
import mongoose from 'mongoose';

interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    sourceUserId?: string;
    targetType?: 'book' | 'comment' | 'review';
    targetId?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
    try {
        // Don't notify yourself
        if (input.sourceUserId && input.sourceUserId === input.userId) return;

        await Notification.create({
            userId: new mongoose.Types.ObjectId(input.userId),
            type: input.type,
            title: input.title,
            message: input.message,
            sourceUser: input.sourceUserId ? new mongoose.Types.ObjectId(input.sourceUserId) : undefined,
            targetType: input.targetType,
            targetId: input.targetId ? new mongoose.Types.ObjectId(input.targetId) : undefined,
        });
    } catch (error) {
        // Notifications should never break the main flow
        console.error('Failed to create notification:', error);
    }
}

export async function createBulkNotifications(
    userIds: string[],
    data: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
    try {
        const notifications = userIds
            .filter(id => id !== data.sourceUserId) // Don't notify self
            .map(userId => ({
                userId: new mongoose.Types.ObjectId(userId),
                type: data.type,
                title: data.title,
                message: data.message,
                sourceUser: data.sourceUserId ? new mongoose.Types.ObjectId(data.sourceUserId) : undefined,
                targetType: data.targetType,
                targetId: data.targetId ? new mongoose.Types.ObjectId(data.targetId) : undefined,
            }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Failed to create bulk notifications:', error);
    }
}

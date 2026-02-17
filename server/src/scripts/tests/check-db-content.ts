
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Book } from '../../modules/books/book.model';
import { User } from '../../modules/users/user.model';
import { Genre } from '../../modules/genres/genre.model';
import { Report } from '../../modules/admin/report.model';
import { ReadingList } from '../../modules/library/readingList.model';
import { Chapter } from '../../modules/books/chapter.model';
import { ReadingProgress } from '../../modules/books/readingProgress.model';
import { Comment } from '../../modules/community/comment.model';
import { Like } from '../../modules/community/like.model';
import { Review } from '../../modules/community/review.model';
import { Notification } from '../../modules/notifications/notification.model';
import { ActivityLog } from '../../modules/analytics/activityLog.model';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
}

async function checkContent() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI as string);
        console.log('✅ Connected to MongoDB');

        console.log('\n📊 Checking Collection Counts...');

        const counts = {
            Books: await Book.countDocuments(),
            Users: await User.countDocuments(),
            Genres: await Genre.countDocuments(),
            Reports: await Report.countDocuments(),
            ReadingLists: await ReadingList.countDocuments(),
            Chapters: await Chapter.countDocuments(),
            ReadingProgress: await ReadingProgress.countDocuments(),
            Comments: await Comment.countDocuments(),
            Likes: await Like.countDocuments(),
            Reviews: await Review.countDocuments(),
            Notifications: await Notification.countDocuments(),
            ActivityLogs: await ActivityLog.countDocuments()
        };

        console.table(counts);

        // Fetch 1 sample from each non-empty collection to show schema
        console.log('\n🔍 Showing 1 sample document from major collections:');

        if (counts.Books > 0) console.log('\n📚 Book Sample:', await Book.findOne().lean());
        if (counts.Users > 0) console.log('\n👤 User Sample:', await User.findOne().lean());
        if (counts.Genres > 0) console.log('\n🏷️ Genre Sample:', await Genre.findOne().lean());
        if (counts.Reports > 0) console.log('\n🚩 Report Sample:', await Report.findOne().lean());
        if (counts.ReadingLists > 0) console.log('\n📖 ReadingList Sample:', await ReadingList.findOne().lean());
        if (counts.Chapters > 0) console.log('\n📄 Chapter Sample:', await Chapter.findOne().lean());
        if (counts.ReadingProgress > 0) console.log('\n📈 ReadingProgress Sample:', await ReadingProgress.findOne().lean());
        if (counts.Comments > 0) console.log('\n💬 Comment Sample:', await Comment.findOne().lean());
        if (counts.Likes > 0) console.log('\n❤️ Like Sample:', await Like.findOne().lean());
        if (counts.Reviews > 0) console.log('\n⭐ Review Sample:', await Review.findOne().lean());
        if (counts.Notifications > 0) console.log('\n🔔 Notification Sample:', await Notification.findOne().lean());
        if (counts.ActivityLogs > 0) console.log('\n📊 ActivityLog Sample:', await ActivityLog.findOne().lean());

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

checkContent();

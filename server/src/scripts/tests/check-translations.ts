
import mongoose from 'mongoose';
import { Book } from '../../modules/books/book.model';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });

async function checkTranslations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const booksWithGroup = await Book.countDocuments({ translationGroupId: { $exists: true } });
        console.log(`Books with translationGroupId: ${booksWithGroup}`);

        const groups = await Book.aggregate([
            { $match: { translationGroupId: { $exists: true } } },
            { $group: { _id: "$translationGroupId", count: { $sum: 1 }, titles: { $push: "$title" }, languages: { $push: "$language" } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log('--- Translation Groups (Count > 1) ---');
        console.log(JSON.stringify(groups, null, 2));

        if (groups.length === 0) {
            console.log('No linked translations found.');
            // Check potential candidates
            const candidates = await Book.aggregate([
                { $group: { _id: { title: "$title", author: "$authorName" }, count: { $sum: 1 }, ids: { $push: "$_id" } } },
                { $match: { count: { $gt: 1 } } }
            ]).limit(5);
            console.log('--- Potential Candidates (Same Title/Author) ---');
            console.log(JSON.stringify(candidates, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkTranslations();

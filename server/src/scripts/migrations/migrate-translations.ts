
import mongoose from 'mongoose';
import { Book } from '../../modules/books/book.model';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });

async function migrateTranslations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // find all books
        const books = await Book.find({});
        console.log(`Found ${books.length} books.`);

        let updates = 0;

        // Group by Title + Author (simple normalization)
        const groups: { [key: string]: any[] } = {};

        for (const book of books) {
            const key = `${book.title.trim().toLowerCase()}|${book.authorName.trim().toLowerCase()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(book);
        }

        for (const key in groups) {
            const groupBooks = groups[key];
            if (groupBooks.length > 1) {
                console.log(`Processing group: ${key} (${groupBooks.length} books)`);

                // Check if any book already has a group ID
                let existingGroupId = groupBooks.find(b => b.translationGroupId)?.translationGroupId;

                if (!existingGroupId) {
                    existingGroupId = new mongoose.Types.ObjectId();
                }

                for (const book of groupBooks) {
                    if (!book.translationGroupId || book.translationGroupId.toString() !== existingGroupId.toString()) {
                        book.translationGroupId = existingGroupId;
                        await book.save();
                        updates++;
                    }
                }
            }
        }

        console.log(`Migration complete. Updated ${updates} books.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateTranslations();

import mongoose from 'mongoose';
import { User } from '../../modules/users/user.model';
import { Book } from '../../modules/books/book.model';
import { Review } from '../../modules/community/review.model';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const runVerification = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create Author
        const authorEmail = `author_${Date.now()}@test.com`;
        const author = await User.create({
            displayName: 'Review Author',
            email: authorEmail,
            password: 'password123',
            role: 'author'
        });
        const authorToken = jwt.sign({ userId: author._id, role: author.role }, env.JWT_SECRET);
        console.log(`✅ Created Author: ${author.email}`);

        // 2. Create Book
        const book = await Book.create({
            title: 'Reviewed Book',
            description: 'A great book',
            author: author._id,
            authorName: author.displayName,
            contentType: 'novel',
            fileUrl: '/uploads/test.epub',
            status: 'approved',
            isPublic: true
        });
        console.log(`✅ Created Book: ${book.title}`);

        // 3. Create Reviewer
        const reviewer = await User.create({
            displayName: 'Reviewer',
            email: `reviewer_${Date.now()}@test.com`,
            password: 'password123'
        });

        // 4. Add Review
        await Review.create({
            bookId: book._id,
            userId: reviewer._id,
            userName: reviewer.displayName,
            rating: 5,
            content: 'Amazing book!',
        });
        console.log(`✅ Added Review`);

        // 5. Test Author Stats
        console.log('Testing GET /api/author/stats...');
        try {
            const statsRes = await axios.get(`${API_URL}/author/stats`, {
                headers: { Authorization: `Bearer ${authorToken}` }
            });

            if (statsRes.data.totalReviews === 1) {
                console.log('✅ Stats Verified: totalReviews = 1');
            } else {
                console.error('❌ Stats Failed:', statsRes.data);
            }
        } catch (error: any) {
            console.error('❌ Stats API Error:', error.response?.data || error.message);
        }

        // 6. Test Author Reviews
        console.log('Testing GET /api/author/reviews...');
        try {
            const reviewsRes = await axios.get(`${API_URL}/author/reviews`, {
                headers: { Authorization: `Bearer ${authorToken}` }
            });

            if (reviewsRes.data.reviews.length === 1 && reviewsRes.data.reviews[0].content === 'Amazing book!') {
                console.log('✅ Reviews Verified: Content matches');
            } else {
                console.error('❌ Reviews Failed:', reviewsRes.data);
            }
        } catch (error: any) {
            console.error('❌ Reviews API Error:', error.response?.data || error.message);
        }

        // Cleanup
        await User.deleteMany({ email: { $in: [author.email, reviewer.email] } });
        await Book.deleteOne({ _id: book._id });
        await Review.deleteMany({ bookId: book._id });
        console.log('✅ Cleanup Complete');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();

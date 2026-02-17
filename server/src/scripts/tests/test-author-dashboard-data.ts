import mongoose from 'mongoose';
import { User } from '../../modules/users/user.model';
import { Book } from '../../modules/books/book.model';
import { Comment } from '../../modules/community/comment.model';
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
            displayName: 'Test Author',
            email: authorEmail,
            password: 'password123',
            role: 'author'
        });
        const authorToken = jwt.sign({ userId: author._id, role: author.role }, env.JWT_SECRET);
        console.log(`✅ Created Author: ${author.email}`);

        // 2. Create Book for Author
        const book = await Book.create({
            title: 'My Bestseller',
            description: 'A great book',
            author: author._id,
            authorName: author.displayName,
            contentType: 'novel',
            fileUrl: '/uploads/test.epub',
            coverUrl: '/uploads/cover.jpg',
            status: 'approved',
            isPublic: true,
            views: 100,
            likes: 50
        });
        console.log(`✅ Created Book: ${book.title}`);

        // 3. Create Commenter
        const commenter = await User.create({
            displayName: 'Fan Reader',
            email: `fan_${Date.now()}@test.com`,
            password: 'password123'
        });

        // 4. Add Comment
        await Comment.create({
            bookId: book._id,
            userId: commenter._id,
            userName: commenter.displayName,
            content: 'Great story!',
            likes: 5
        });
        console.log(`✅ Added Comment`);

        // 5. Test Author Stats Endpoint
        console.log('Testing GET /api/author/stats...');
        try {
            const statsRes = await axios.get(`${API_URL}/author/stats`, {
                headers: { Authorization: `Bearer ${authorToken}` }
            });

            console.log('Stats Response:', statsRes.data);
            if (statsRes.data.totalBooks === 1 && statsRes.data.totalComments === 1) {
                console.log('✅ Stats Verified');
            } else {
                console.error('❌ Stats mismatch');
            }
        } catch (error: any) {
            console.error('❌ Failed to fetch stats:', error.response?.data || error.message);
        }

        // 6. Test Author Comments Endpoint
        console.log('Testing GET /api/author/comments...');
        try {
            const commentsRes = await axios.get(`${API_URL}/author/comments`, {
                headers: { Authorization: `Bearer ${authorToken}` }
            });

            console.log('Comments Response:', JSON.stringify(commentsRes.data, null, 2));
            if (commentsRes.data.comments.length === 1 && commentsRes.data.comments[0].content === 'Great story!') {
                console.log('✅ Comments Verified');
            } else {
                console.error('❌ Comments mismatch');
            }
        } catch (error: any) {
            console.error('❌ Failed to fetch comments:', error.response?.data || error.message);
        }

        // Cleanup
        await User.deleteMany({ email: { $in: [author.email, commenter.email] } });
        await Book.deleteOne({ _id: book._id });
        await Comment.deleteMany({ bookId: book._id });
        console.log('✅ Cleanup Complete');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();

import mongoose from 'mongoose';
import { User } from '../../modules/users/user.model';
import { Book } from '../../modules/books/book.model';
import { Notification } from '../../modules/notifications/notification.model';
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
            displayName: 'Test Notification Author',
            email: authorEmail,
            password: 'password123',
            role: 'author'
        });
        console.log(`✅ Created Author: ${author.email}`);

        // 2. Create Admin
        const adminEmail = `admin_${Date.now()}@test.com`;
        const admin = await User.create({
            displayName: 'Test Admin',
            email: adminEmail,
            password: 'password123',
            role: 'admin'
        });
        const adminToken = jwt.sign({ userId: admin._id, role: admin.role }, env.JWT_SECRET);
        console.log(`✅ Created Admin: ${admin.email}`);

        // 3. Create Pending Book
        const book = await Book.create({
            title: 'Pending Book',
            description: 'Waiting for approval',
            author: author._id,
            authorName: author.displayName,
            contentType: 'novel',
            fileUrl: '/uploads/pending.epub',
            coverUrl: '/uploads/cover.jpg',
            status: 'pending',
            isPublic: false
        });
        console.log(`✅ Created Pending Book: ${book.title}`);

        // 4. Admin Approves Book
        console.log('Testing PATCH /api/admin/content/:id/approve...');
        try {
            const approveRes = await axios.patch(
                `${API_URL}/admin/content/${book._id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );

            if (approveRes.status === 200 && approveRes.data.book.status === 'approved') {
                console.log('✅ Book Approved via API');
            } else {
                console.error('❌ Book approval failed:', approveRes.data);
            }
        } catch (error: any) {
            console.error('❌ API Error:', error.response?.data || error.message);
        }

        // 5. Verify Notification Created
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for async ops if any
        const notification = await Notification.findOne({
            userId: author._id,
            type: 'book_approved',
            targetId: book._id
        });

        if (notification) {
            console.log('✅ Notification Found:', notification.message);
            console.log('✅ Verify Notification: SUCCESS');
        } else {
            console.error('❌ Notification NOT Found');
        }

        // Cleanup
        await User.deleteMany({ email: { $in: [author.email, admin.email] } });
        await Book.deleteOne({ _id: book._id });
        await Notification.deleteMany({ userId: author._id });
        console.log('✅ Cleanup Complete');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { User } from '../../modules/users/user.model';
import { Book } from '../../modules/books/book.model';

dotenv.config();

// Ensure fetch is available (Node 18+)
// @ts-ignore
if (!global.fetch) {
    console.error('❌ This script requires Node.js 18+ for native fetch/FormData support.');
    process.exit(1);
}

const API_URL = 'http://localhost:5001/api/books/upload';
const TEST_EMAIL = 'test-author@example.com';
const EPUB_URL = 'https://www.gutenberg.org/ebooks/11.epub.images'; // Alice in Wonderland
const TEMP_FILE = path.join(process.cwd(), 'temp-alice.epub');
const TEMP_COVER = path.join(process.cwd(), 'temp-cover.jpg');

async function testUpload() {
    console.log('🚀 Starting Author Upload Test (with Cover)...');

    try {
        // 1. Connect to DB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected to MongoDB');

        // 2. Setup User
        console.log(`👤 Setting up test user: ${TEST_EMAIL}...`);
        let user = await User.findOne({ email: TEST_EMAIL });
        if (!user) {
            user = await User.create({
                displayName: 'Test Author',
                email: TEST_EMAIL,
                password: 'password123',
                role: 'author',
            });
            console.log('   ✅ Created new test user');
        } else {
            if (user.role !== 'author') {
                user.role = 'author';
                await user.save();
                console.log('   ✅ Updated existing user role to author');
            } else {
                console.log('   ✅ User exists and is an author');
            }
        }

        // 3. Generate Token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        console.log('🔑 Generated Auth Token');

        // 4. Download Sample EPUB & Create Dummy Cover
        console.log(`📥 Downloading sample EPUB from ${EPUB_URL}...`);
        const epubRes = await fetch(EPUB_URL);
        if (!epubRes.ok) throw new Error(`Failed to download EPUB: ${epubRes.statusText}`);

        const epubBuffer = await epubRes.arrayBuffer();
        fs.writeFileSync(TEMP_FILE, Buffer.from(epubBuffer));
        console.log(`   ✅ Downloaded EPUB to ${TEMP_FILE}`);

        // Create a dummy cover file
        fs.writeFileSync(TEMP_COVER, 'dummy image content');
        console.log(`   ✅ Created dummy cover at ${TEMP_COVER}`);

        // 5. Construct FormData
        console.log('📦 Preparing Upload Request...');
        const formData = new FormData();
        formData.append('title', 'Alice in Wonderland (Test Upload + Cover)');
        formData.append('description', 'A test upload with cover image.');
        formData.append('language', 'en');
        formData.append('genres', 'Fantasy');

        const fileBlob = new Blob([epubBuffer], { type: 'application/epub+zip' });
        formData.append('file', fileBlob, 'alice.epub');

        const coverBlob = new Blob([Buffer.from('dummy image content')], { type: 'image/jpeg' });
        formData.append('cover', coverBlob, 'cover.jpg');

        // 6. Send Request
        console.log(`📤 Sending POST request to ${API_URL}...`);
        const uploadRes = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        const responseText = await uploadRes.text();

        console.log(`\nResponse Status: ${uploadRes.status} ${uploadRes.statusText}`);
        try {
            const json = JSON.parse(responseText);
            console.log('Response Body:', JSON.stringify(json, null, 2));

            if (uploadRes.ok) {
                console.log('\n✅ Upload Successful!');

                // Verify DB
                const book = await Book.findById(json.book.id);
                if (book) {
                    console.log(`📚 Database Verification:`);
                    console.log(`   - Title: "${book.title}"`);
                    console.log(`   - ID: ${book._id}`);
                    console.log(`   - Status: ${book.status} (Expected: pending)`);

                    if (book.status === 'pending') {
                        console.log('   ✅ Book is correctly in PENDING status.');
                    } else {
                        console.error(`   ❌ Book status is ${book.status}, expected pending.`);
                    }

                } else {
                    console.error('❌ Database Verification Failed: Book ID returned but not found in DB.');
                }

            } else {
                console.error('\n❌ Upload Failed.');
            }

        } catch (e) {
            console.log('Response Body (Raw):', responseText);
        }

        // Cleanup
        if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE);
        if (fs.existsSync(TEMP_COVER)) fs.unlinkSync(TEMP_COVER);

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testUpload();

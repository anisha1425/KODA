import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Genre } from '../../modules/genres/genre.model';
import { Book } from '../../modules/books/book.model';

dotenv.config();

const GENRES = [
    { slug: 'fantasy', name: 'Fantasy', icon: '✨', description: 'Epic quests, magic systems, and mythical worlds', color: ['#7C3AED', '#A78BFA'], sortOrder: 1 },
    { slug: 'romance', name: 'Romance', icon: '💕', description: 'Love stories that make your heart flutter', color: ['#EC4899', '#F9A8D4'], sortOrder: 2 },
    { slug: 'sci-fi', name: 'Sci-Fi', icon: '🚀', description: 'Space exploration, future tech, and alien encounters', color: ['#0EA5E9', '#7DD3FC'], sortOrder: 3 },
    { slug: 'horror', name: 'Horror', icon: '👻', description: 'Spine-chilling tales that keep you up at night', color: ['#1F2937', '#6B7280'], sortOrder: 4 },
    { slug: 'comedy', name: 'Comedy', icon: '😄', description: 'Stories that bring laughter and joy', color: ['#F59E0B', '#FCD34D'], sortOrder: 5 },
    { slug: 'drama', name: 'Drama', icon: '🎭', description: 'Emotional narratives of the human experience', color: ['#DC2626', '#FCA5A5'], sortOrder: 6 },
    { slug: 'mystery', name: 'Mystery', icon: '🔍', description: 'Whodunits and puzzles waiting to be solved', color: ['#4338CA', '#818CF8'], sortOrder: 7 },
    { slug: 'adventure', name: 'Adventure', icon: '🧭', description: 'Thrilling journeys into the unknown', color: ['#059669', '#6EE7B7'], sortOrder: 8 },
    { slug: 'historical', name: 'Historical', icon: '🏛️', description: 'Stories set in fascinating periods of history', color: ['#92400E', '#D97706'], sortOrder: 9 },
    { slug: 'poetry', name: 'Poetry', icon: '🪶', description: 'Beautiful verses and lyrical expressions', color: ['#9333EA', '#C084FC'], sortOrder: 10 },
    { slug: 'thriller', name: 'Thriller', icon: '⚡', description: 'Edge-of-your-seat suspense and action', color: ['#B91C1C', '#F87171'], sortOrder: 11 },
    { slug: 'slice-of-life', name: 'Slice of Life', icon: '☕', description: 'Everyday moments that resonate deeply', color: ['#D97706', '#FDE68A'], sortOrder: 12 },
];

async function seedGenres() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        for (const genre of GENRES) {
            await Genre.findOneAndUpdate(
                { slug: genre.slug },
                { ...genre, isActive: true },
                { upsert: true, new: true }
            );
        }

        console.log(`✅ Seeded ${GENRES.length} genres successfully`);

        // Update book counts
        for (const genre of GENRES) {
            const count = await Book.countDocuments({ genres: genre.slug });
            await Genre.updateOne({ slug: genre.slug }, { bookCount: count });
        }
        console.log('✅ Updated genre book counts');

        await mongoose.disconnect();
        console.log('✅ Done!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedGenres();

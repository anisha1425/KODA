
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const SOURCE_URI = process.env.OLD_MONGODB_URI || 'mongodb://localhost:27017/koda_old';
const DEST_URI = process.env.MONGODB_URI;

if (!DEST_URI) {
    console.error('❌ MONGODB_URI (Destination) is not defined in .env');
    process.exit(1);
}

if (SOURCE_URI === DEST_URI) {
    console.error('❌ Source and Destination URIs are the same! Aborting to prevent data corruption.');
    process.exit(1);
}

async function migrate() {
    console.log('🚀 Starting Data Migration...');
    console.log('--------------------------------');

    let sourceConn: mongoose.Connection | null = null;
    let destConn: mongoose.Connection | null = null;

    try {
        // 1. Connect to Source
        console.log('🔌 Connecting to Source Database...');
        sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
        console.log('✅ Connected to Source');

        // 2. Get All Collections
        if (!sourceConn.db) throw new Error('Source DB connection failed');
        const collections = await sourceConn.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name).filter(n => n !== 'system.indexes');

        console.log(`📋 Found ${collectionNames.length} collections to migrate: ${collectionNames.join(', ')}`);

        // 3. Connect to Destination
        console.log('\n🔌 Connecting to Destination Database...');
        destConn = await mongoose.createConnection(DEST_URI as string).asPromise();
        console.log('✅ Connected to Destination');

        if (!destConn.db) throw new Error('Destination DB connection failed');

        // 4. Migrate Each Collection
        for (const colName of collectionNames) {
            console.log(`\n📦 Migrating collection: ${colName}...`);

            // Fetch from Source
            const docs = await sourceConn.db.collection(colName).find().toArray();
            console.log(`   - Found ${docs.length} documents in source`);

            if (docs.length === 0) {
                console.log(`   - Skipping empty collection`);
                continue;
            }

            // Insert into Destination
            // Using insertMany with ordered: false to continue on errors (e.g., duplicates)
            try {
                const result = await destConn.db.collection(colName).insertMany(docs, { ordered: false });
                console.log(`   - ✅ Inserted ${result.insertedCount} documents`);
            } catch (err: any) {
                if (err.code === 11000) {
                    console.log(`   - ⚠️  Some documents already exist (duplicates skipped). Inserted: ${err.result?.nInserted || 0}`);
                } else {
                    console.error(`   - ❌ Error inserting documents: ${err.message}`);
                }
            }
        }

        console.log('\n--------------------------------');
        console.log('🎉 Migration Complete!');

    } catch (error) {
        console.error('\n❌ Migration Failed:', error);
    } finally {
        if (sourceConn) {
            await sourceConn.close();
            console.log('🔌 Disconnected from Source');
        }
        if (destConn) {
            await destConn.close();
            console.log('🔌 Disconnected from Destination');
        }
    }
}

migrate();

import app from './app';
import dotenv from 'dotenv';
import { ContentSeeder } from './modules/import/content.seeder';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    // Automated content seeding on startup
    await ContentSeeder.checkAndSeed();
});

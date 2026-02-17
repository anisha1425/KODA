import path from 'path';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';

export interface ParsedComic {
    title: string;
    pages: {
        imagePath: string;
        orderIndex: number;
    }[];
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function isImage(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
}

export async function parseComic(filePath: string, outputDir: string): Promise<ParsedComic> {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();

    // Extract images
    const pages: ParsedComic['pages'] = [];

    // Sort entries by name to maintain page order
    const imageEntries = entries
        .filter((entry) => !entry.isDirectory && isImage(entry.entryName))
        .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

    // Create output directory
    const comicOutputDir = path.join(outputDir, `comic_${Date.now()}`);
    await fs.mkdir(comicOutputDir, { recursive: true });

    for (let i = 0; i < imageEntries.length; i++) {
        const entry = imageEntries[i];
        const ext = path.extname(entry.entryName);
        const outputPath = path.join(comicOutputDir, `page_${String(i).padStart(4, '0')}${ext}`);

        // Extract image
        const data = entry.getData();
        await fs.writeFile(outputPath, data);

        pages.push({
            imagePath: outputPath,
            orderIndex: i,
        });
    }

    // Get title from filename
    const title = path.basename(filePath, path.extname(filePath));

    return {
        title,
        pages,
    };
}

import path from 'path';
import fs from 'fs/promises';
import EPub from 'epub2';

export interface ParsedEpub {
    title: string;
    author: string;
    coverPath?: string;
    chapters: {
        title: string;
        content: string;
        orderIndex: number;
    }[];
}

/**
 * Clean and format HTML content for better display
 */
function cleanHtmlContent(html: string): string {
    if (!html) return '';

    // Remove XML declarations and DOCTYPE
    let cleaned = html.replace(/<\?xml[^>]*\?>/gi, '');
    cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');

    // Extract body content if present
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        cleaned = bodyMatch[1];
    }

    // Remove script and style tags
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove image tags (we focus on text novels)
    cleaned = cleaned.replace(/<img[^>]*>/gi, '');

    // Convert heading tags to proper structure
    cleaned = cleaned.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '<h2 class="chapter-heading">$1</h2>');
    cleaned = cleaned.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '<h3 class="section-heading">$1</h3>');

    // Ensure paragraphs have proper spacing
    cleaned = cleaned.replace(/<p[^>]*>/gi, '<p>');

    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/>\s+</g, '><');

    // Add proper paragraph breaks for readability
    cleaned = cleaned.replace(/<\/p>\s*<p>/g, '</p>\n<p>');

    return cleaned.trim();
}

/**
 * Extract a meaningful chapter title from content or TOC
 */
function extractChapterTitle(tocTitle: string | undefined, content: string, index: number): string {
    // If TOC has a good title, use it
    if (tocTitle && tocTitle.trim() && !tocTitle.toLowerCase().includes('undefined')) {
        return tocTitle.trim();
    }

    // Try to extract title from content headings
    const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
        const title = h1Match[1].replace(/<[^>]*>/g, '').trim();
        if (title && title.length < 100) return title;
    }

    const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (h2Match) {
        const title = h2Match[1].replace(/<[^>]*>/g, '').trim();
        if (title && title.length < 100) return title;
    }

    // Check for common chapter patterns in text
    const chapterPatterns = [
        /CHAPTER\s+([IVXLCDM\d]+)/i,
        /Chapter\s+(\d+)/i,
        /ACT\s+([IVXLCDM\d]+)/i,
        /SCENE\s+([IVXLCDM\d]+)/i,
        /PART\s+([IVXLCDM\d]+)/i,
    ];

    const textContent = content.replace(/<[^>]*>/g, ' ').trim();
    for (const pattern of chapterPatterns) {
        const match = textContent.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }

    return `Chapter ${index + 1}`;
}

/**
 * Check if content is meaningful (not just navigation/cover/etc)
 */
function isMeaningfulContent(content: string): boolean {
    if (!content) return false;

    // Remove HTML tags and check text length
    const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Skip if too short (likely navigation, cover, etc)
    if (textOnly.length < 100) return false;

    // Skip if it's mostly links/navigation
    const linkCount = (content.match(/<a[^>]*>/gi) || []).length;
    const wordCount = textOnly.split(/\s+/).length;
    if (linkCount > wordCount / 3) return false;

    return true;
}

export async function parseEpub(filePath: string): Promise<ParsedEpub> {
    return new Promise((resolve, reject) => {
        const epub = new EPub(filePath);

        epub.on('error', reject);
        epub.on('end', async () => {
            try {
                const chapters: ParsedEpub['chapters'] = [];
                const seenIds = new Set<string>();

                // Get metadata
                const title = epub.metadata.title || 'Untitled';
                const author = epub.metadata.creator || 'Unknown Author';

                // Build TOC lookup map for better titles
                const tocMap = new Map<string, string>();
                if (epub.toc && Array.isArray(epub.toc)) {
                    const processToc = (items: typeof epub.toc) => {
                        for (const item of items) {
                            if (item.id && item.title) {
                                tocMap.set(item.id, item.title);
                            }
                            // Handle href-based TOC entries
                            if (item.href && item.title) {
                                const hrefId = item.href.split('#')[0].replace(/\.x?html?$/i, '');
                                tocMap.set(hrefId, item.title);
                            }
                        }
                    };
                    processToc(epub.toc);
                }

                // Extract chapters from flow (spine order)
                const flow = epub.flow || [];
                let chapterIndex = 0;

                for (const item of flow) {
                    const chapterId = item.id as string;

                    // Skip duplicates
                    if (seenIds.has(chapterId)) continue;
                    seenIds.add(chapterId);

                    // Get chapter content
                    const content = await new Promise<string>((res, rej) => {
                        epub.getChapter(chapterId, (err, text) => {
                            if (err) rej(err);
                            else res(text || '');
                        });
                    });

                    // Skip non-meaningful content (covers, nav, etc)
                    if (!isMeaningfulContent(content)) continue;

                    // Clean HTML content
                    const cleanedContent = cleanHtmlContent(content);

                    // Get title from TOC or extract from content
                    const tocTitle = tocMap.get(chapterId) || item.title;
                    const chapterTitle = extractChapterTitle(tocTitle, content, chapterIndex);

                    chapters.push({
                        title: chapterTitle,
                        content: cleanedContent,
                        orderIndex: chapterIndex,
                    });

                    chapterIndex++;
                }

                // Get cover
                let coverPath: string | undefined;
                const coverId = epub.metadata.cover;
                if (coverId && epub.manifest[coverId]) {
                    const coverInfo = epub.manifest[coverId];
                    const tempDir = path.dirname(filePath);
                    const href = coverInfo.href || 'cover.jpg';
                    coverPath = path.join(tempDir, `cover_${Date.now()}.${href.split('.').pop()}`);

                    await new Promise<void>((res) => {
                        epub.getImage(coverId, (err, data) => {
                            if (err || !data) {
                                res();
                                return;
                            }
                            fs.writeFile(coverPath!, data)
                                .then(() => res())
                                .catch(() => res());
                        });
                    });
                }

                resolve({
                    title,
                    author,
                    coverPath,
                    chapters,
                });
            } catch (error) {
                reject(error);
            }
        });

        epub.parse();
    });
}


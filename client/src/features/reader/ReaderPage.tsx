import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksApi, progressApi, libraryApi } from '@/lib/api';
import ReaderHeader from './components/ReaderHeader';
import ChapterContent from './components/ChapterContent';

interface BookData {
    _id: string;
    title: string;
    authorName: string;
    totalChapters: number;
    source: 'user' | 'gutenberg' | 'internet_archive';
    externalUrl?: string;
    fileUrl?: string;
    archiveId?: string;
    language?: string;
    translationGroupId?: string;
}

interface ChapterData {
    _id: string;
    title: string;
    orderIndex: number;
    content?: string;
}

export default function ReaderPage() {
    const { bookId } = useParams<{ bookId: string }>();
    const navigate = useNavigate();

    // Book and chapter data from API
    const [book, setBook] = useState<BookData | null>(null);
    const [chapters, setChapters] = useState<ChapterData[]>([]);
    const [currentChapter, setCurrentChapter] = useState<ChapterData | null>(null);
    const [relatedBooks, setRelatedBooks] = useState<BookData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fixed UI State (User requested defaults)
    const fontSize = 12; // Default requested by user
    const fontFamily = 'serif';

    // Pagination State
    const [isPagedMode] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const chapterContentRef = useRef<{ calculatePages: () => void } | null>(null);

    // Fetch book and chapters on mount
    useEffect(() => {
        if (!bookId) return;

        const fetchBookData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch book details
                const bookResponse = await booksApi.getById(bookId);
                const bookData = bookResponse.data;
                setBook(bookData);

                // Fetch linked translations if available
                if (bookData.translationGroupId) {
                    try {
                        const relatedRes = await booksApi.getAll({ translationGroupId: bookData.translationGroupId });
                        // Filter out current book
                        setRelatedBooks(relatedRes.data.books.filter((b: BookData) => b._id !== bookData._id));
                    } catch (err) {
                        console.error('Failed to fetch translations:', err);
                    }
                } else {
                    setRelatedBooks([]);
                }

                // Fetch chapters list
                let chaptersResponse = await booksApi.getChapters(bookId);
                let chaptersData = chaptersResponse.data;

                // Lazy loading: If no chapters and it's a Gutenberg book, fetch content on-demand
                if (chaptersData.length === 0 && bookData.source === 'gutenberg' && bookData.fileUrl) {
                    console.log('🔄 Lazy loading: Fetching content on-demand...');
                    try {
                        await booksApi.fetchContent(bookId);
                        // Re-fetch chapters after content is loaded
                        chaptersResponse = await booksApi.getChapters(bookId);
                        chaptersData = chaptersResponse.data;
                    } catch (fetchErr) {
                        console.error('Failed to lazy load content:', fetchErr);
                        // Continue - will show external redirect option
                    }
                }

                setChapters(chaptersData);

                // Fetch first chapter content
                if (chaptersData.length > 0) {
                    // Check for existing progress
                    try {
                        const progressRes = await progressApi.get(bookId);
                        const progress = progressRes.data;

                        if (progress && progress.chapterIndex !== undefined) {
                            console.log('Resume reading from:', progress);
                            const targetIdx = progress.chapterIndex;

                            // Fetch content for saved chapter
                            const chapterResponse = await booksApi.getChapter(bookId, String(targetIdx));
                            setCurrentChapter(chapterResponse.data);
                            setCurrentChapterIndex(targetIdx);

                            // Restore page if available (approximate)
                            if (progress.percentage > 0) {
                                // We'll let the calculatePages logic handle this once content loads
                                // Storing target percentage to restore later
                                setTimeout(() => {
                                    if (chapterContentRef.current && totalPages > 1) {
                                        const targetPage = Math.max(1, Math.round(progress.percentage / 100 * totalPages));
                                        setCurrentPage(targetPage);
                                    }
                                }, 500);
                            }
                        } else {
                            // Default to first chapter
                            const firstChapterResponse = await booksApi.getChapter(bookId, '0');
                            setCurrentChapter(firstChapterResponse.data);
                        }
                    } catch (err) {
                        console.warn('Failed to fetch progress, defaulting to start', err);
                        const firstChapterResponse = await booksApi.getChapter(bookId, '0');
                        setCurrentChapter(firstChapterResponse.data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch book data:', err);
                setError('Failed to load book. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookId]); // totalPages excluded intentionally to prevent loop during init

    // Save Progress
    const saveProgress = async () => {
        if (!bookId) return;
        try {
            const percentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

            // 1. Update Progress
            await progressApi.update(bookId, {
                chapterIndex: currentChapterIndex,
                scrollPosition: 0, // Not using scroll for paged mode
                percentage: percentage
            });

            // 2. Ensure book is in Library (Status: Reading)
            try {
                const checkRes = await libraryApi.check(bookId);
                if (!checkRes.data.inLibrary) {
                    await libraryApi.add(bookId, { status: 'reading' });
                    console.log('Added to library as reading');
                } else if (checkRes.data.status !== 'reading' && checkRes.data.status !== 'completed') {
                    // Optional: Update status to reading if it was want_to_read or dropped?
                    // Let's strictly ensuring it's in the library for now.
                    // If user dropped it, maybe don't auto-revive? 
                    // But if they explicitly clicked Bookmark, they probably want to read it.
                    await libraryApi.update(bookId, { status: 'reading' });
                }
            } catch (libErr) {
                console.error('Failed to update library status:', libErr);
            }

            console.log('Progress saved');
        } catch (err) {
            console.error('Failed to save progress:', err);
        }
    };

    // Auto-save on navigation (debounce could be added if needed, but chapter change is rare enough)
    useEffect(() => {
        if (currentChapter) {
            saveProgress();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentChapterIndex]); // Save when finishing a chapter

    // Reset page on chapter change (moved logic here to handle restore)
    useEffect(() => {
        // Only reset to 1 if we are NOT restoring (we could add a flag, but for now simple)
        // Actually, the initial load logic sets the chapter AND page.
        // Subsequent chapter changes should reset to 1.
        // We can check if the chapter changed via navigation.
    }, [currentChapter]);

    // Better page reset logic:
    // When chapter index changes, we usually want to go to page 1.
    // EXCEPT when we are loading from a bookmark. 
    // The initial load happens once. 
    // Let's rely on the fact that handleChapterSelect calls setCurrentPage(1) usually?
    // No, handleChapterSelect doesn't.
    // Let's make handleChapterSelect do it.

    // Calculate pages effect
    useEffect(() => {
        // Small delay to let content render before recalculating pages
        setTimeout(() => {
            chapterContentRef.current?.calculatePages();
        }, 100);
    }, [currentChapter]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                e.preventDefault();
                handleNextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, totalPages, currentChapter, chapters]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        } else {
            // Next chapter
            const nextChapterIndex = currentChapterIndex < chapters.length - 1 ? currentChapterIndex + 1 : -1;

            if (nextChapterIndex !== -1) {
                handleChapterSelect(String(chapters[nextChapterIndex].orderIndex));
            }
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        } else {
            // Previous chapter
            const prevChapterIndex = currentChapterIndex > 0 ? currentChapterIndex - 1 : -1;

            if (prevChapterIndex !== -1) {
                handleChapterSelect(String(chapters[prevChapterIndex].orderIndex));
            }
        }
    };

    const handleChapterSelect = async (chapterId: string) => {
        if (!bookId) return;

        const chapterIndex = chapters.findIndex(c => c._id === chapterId || String(c.orderIndex) === chapterId);
        if (chapterIndex === -1) return;

        try {
            const chapterResponse = await booksApi.getChapter(bookId, String(chapterIndex));
            setCurrentChapter(chapterResponse.data);
            setCurrentChapterIndex(chapterIndex);
            setCurrentPage(1); // Reset page on explicit navigation
        } catch (err) {
            console.error('Failed to fetch chapter:', err);
        }
    };

    const handleLanguageChange = (targetBookId: string) => {
        navigate(`/read/${targetBookId}`);
    };

    // Prepare available languages for the header
    const availableLanguages = relatedBooks
        .filter(b => b.language)
        .map(b => ({ code: b.language!, bookId: b._id }));

    // Global style to hide scrollbars specifically for reader context
    const hideScrollbarStyle = `
        .reader-container ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
        .reader-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        /* Ensure no global scrollbar overrides */
        body::-webkit-scrollbar {
            display: none !important;
        }
    `;

    // Loading state
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">
                        {chapters.length === 0 && book?.source === 'gutenberg'
                            ? 'Downloading book content...'
                            : 'Loading book...'}
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !book) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <p className="text-xl text-red-600 mb-4">{error || 'Book not found'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-primary hover:underline"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Internet Archive Embed Reader
    if (book.source === 'internet_archive' && book.archiveId) {
        return (
            <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
                <ReaderHeader
                    bookTitle={book.title}
                />
                <div className="flex-grow w-full h-full relative">
                    <iframe
                        src={`https://archive.org/embed/${book.archiveId}`}
                        className="w-full h-full border-0 absolute inset-0"
                        allowFullScreen
                        title={`Reading ${book.title}`}
                    />
                </div>
            </div>
        );
    }

    // External book state
    if (chapters.length === 0 && book.source !== 'user') {
        const readUrl = book.externalUrl || book.fileUrl;
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-lg mx-auto p-8">
                    <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">
                        {book.title}
                    </h1>
                    <p className="text-gray-500 mb-8">by {book.authorName}</p>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
                        <p className="text-gray-500 mb-4">
                            This book is available from an external source.
                        </p>
                        {readUrl && (
                            <a
                                href={readUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all shadow-md"
                            >
                                Read on Source
                            </a>
                        )}
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-primary hover:underline"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Format chapters helper
    const formattedChapters = chapters.map((ch, idx) => ({
        id: String(ch.orderIndex),
        title: ch.title || `Chapter ${idx + 1}`,
    }));

    const prevChapter = currentChapterIndex > 0 ? formattedChapters[currentChapterIndex - 1] : undefined;
    const nextChapter = currentChapterIndex < formattedChapters.length - 1 ? formattedChapters[currentChapterIndex + 1] : undefined;

    return (
        <div className="h-screen w-screen flex flex-col bg-white overflow-hidden relative reader-container">
            <style>{hideScrollbarStyle}</style>
            {/* Header - Always visible as requested */}
            <div className="flex-none z-50">
                <ReaderHeader
                    bookTitle={book.title}
                    availableLanguages={availableLanguages}
                    currentLanguage={book.language || 'en'}
                    onLanguageChange={handleLanguageChange}
                    onBookmark={() => {
                        saveProgress();
                        alert('Bookmark saved!'); // Simple feedback for now
                    }}
                />
            </div>

            <main className="flex-grow flex relative overflow-hidden h-full w-full">
                <ChapterContent
                    ref={chapterContentRef}
                    chapterNumber={currentChapterIndex + 1}
                    chapterTitle={currentChapter?.title || `Chapter ${currentChapterIndex + 1}`}
                    content={currentChapter?.content || '<p>No content available...</p>'}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    onPageCountChange={setTotalPages}
                    currentPage={currentPage}
                    isPagedMode={isPagedMode}
                    prevChapter={prevChapter}
                    nextChapter={nextChapter}
                    onNavigate={handleChapterSelect}
                />

                {/* Left Click Zone */}
                <button
                    className="absolute left-0 top-0 bottom-0 w-24 z-20 cursor-w-resize focus:outline-none"
                    onClick={handlePrevPage}
                    title="Previous Page"
                    aria-label="Previous Page"
                />

                {/* Right Click Zone */}
                <button
                    className="absolute right-0 top-0 bottom-0 w-24 z-20 cursor-e-resize focus:outline-none"
                    onClick={handleNextPage}
                    title="Next Page"
                    aria-label="Next Page"
                />
            </main>

            {/* Footer Progress - minimalist */}
            <div className="fixed bottom-0 left-0 right-0 py-2 bg-white/90 backdrop-blur-sm border-t border-gray-100/50 z-40 pointer-events-none">
                <div className="container mx-auto px-4 flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <div className="w-1/3 truncate text-left">
                        {currentChapter?.title || `Chapter ${currentChapterIndex + 1}`}
                    </div>
                    <div className="w-1/3 flex justify-center">
                        <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                    </div>
                    <div className="w-1/3 text-right">
                        {Math.round(((currentChapterIndex + (currentPage / Math.max(totalPages, 1) * 0.99)) / Math.max(chapters.length, 1)) * 100)}% Complete
                    </div>
                </div>
            </div>
        </div>
    );
}


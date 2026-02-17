import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { booksApi } from '../../lib/api';

interface ComicPage {
    _id: string;
    content: string;
    orderIndex: number;
}

interface Book {
    _id: string;
    title: string;
    authorName: string;
    totalChapters: number;
    source: 'user' | 'gutenberg' | 'internet_archive';
    archiveId?: string;
    externalUrl?: string;
}

export default function ComicReader() {
    const { bookId } = useParams<{ bookId: string }>();
    const [book, setBook] = useState<Book | null>(null);
    const [pages, setPages] = useState<ComicPage[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'single' | 'scroll'>('single');

    const isArchiveComic = book?.source === 'internet_archive' && book?.archiveId;

    useEffect(() => {
        if (!bookId) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const bookRes = await booksApi.getById(bookId);
                setBook(bookRes.data);

                // Only fetch chapters/pages for non-archive comics
                if (bookRes.data.source !== 'internet_archive') {
                    // Fetch chapters with content (image URLs)
                    const chaptersRes = await booksApi.getChapters(bookId, { includeContent: true });
                    setPages(chaptersRes.data);
                }
            } catch {
                setError('Failed to load comic');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [bookId]);

    const goToPage = useCallback((page: number) => {
        if (page >= 0 && page < pages.length) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    }, [pages.length]);

    // Keyboard navigation (only for non-archive comics)
    useEffect(() => {
        if (isArchiveComic) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                goToPage(currentPage + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, goToPage, isArchiveComic]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <p className="text-xl mb-4">{error || 'Comic not found'}</p>
                    <Link to="/" className="text-primary hover:underline">Go back home</Link>
                </div>
            </div>
        );
    }

    // Archive.org embedded reader
    if (isArchiveComic) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                {/* Header */}
                <header className="bg-black/90 backdrop-blur-sm z-50 flex-shrink-0">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <Link to={`/book/${bookId}`} className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                            <span className="material-icons-outlined">arrow_back</span>
                            <span className="hidden sm:inline truncate max-w-[200px]">{book.title}</span>
                        </Link>
                        <span className="px-3 py-1 bg-blue-600/80 text-white text-xs font-medium rounded-full">
                            Internet Archive
                        </span>
                    </div>
                </header>

                {/* Embedded Archive.org BookReader */}
                <div className="flex-1 relative">
                    <iframe
                        src={`https://archive.org/embed/${book.archiveId}`}
                        title={book.title}
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                    />
                </div>
            </div>
        );
    }

    // Local comic reader (user-uploaded comics with stored pages)
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to={`/book/${bookId}`} className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <span className="material-icons-outlined">arrow_back</span>
                        <span className="hidden sm:inline truncate max-w-[200px]">{book.title}</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Page indicator */}
                        <span className="text-sm text-gray-400">
                            {currentPage + 1} / {pages.length}
                        </span>

                        {/* View mode toggle */}
                        <button
                            onClick={() => setViewMode(viewMode === 'single' ? 'scroll' : 'single')}
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                            title={viewMode === 'single' ? 'Switch to scroll mode' : 'Switch to single page'}
                        >
                            <span className="material-icons-outlined">
                                {viewMode === 'single' ? 'view_day' : 'view_carousel'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="pt-16 pb-20">
                {viewMode === 'single' ? (
                    /* Single page mode */
                    <div className="flex items-center justify-center min-h-[calc(100vh-9rem)]">
                        <div className="relative w-full max-w-4xl mx-auto">
                            {pages[currentPage] && (
                                <img
                                    src={pages[currentPage].content}
                                    alt={`Page ${currentPage + 1}`}
                                    className="w-full h-auto max-h-[85vh] object-contain mx-auto"
                                />
                            )}

                            {/* Navigation areas */}
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-start pl-4 disabled:cursor-default"
                            >
                                {currentPage > 0 && (
                                    <span className="bg-black/50 p-2 rounded-full">
                                        <span className="material-icons-outlined text-3xl">chevron_left</span>
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= pages.length - 1}
                                className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-end pr-4 disabled:cursor-default"
                            >
                                {currentPage < pages.length - 1 && (
                                    <span className="bg-black/50 p-2 rounded-full">
                                        <span className="material-icons-outlined text-3xl">chevron_right</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Scroll mode */
                    <div className="max-w-4xl mx-auto px-4 space-y-2">
                        {pages.map((page, index) => (
                            <img
                                key={page._id}
                                src={page.content}
                                alt={`Page ${index + 1}`}
                                className="w-full h-auto"
                                loading="lazy"
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm py-3 px-4 z-50">
                <div className="max-w-7xl mx-auto">
                    {/* Progress bar */}
                    <input
                        type="range"
                        min={0}
                        max={pages.length - 1}
                        value={currentPage}
                        onChange={(e) => goToPage(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />

                    {/* Page thumbnails */}
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                        {pages.slice(0, 10).map((page, index) => (
                            <button
                                key={page._id}
                                onClick={() => goToPage(index)}
                                className={`flex-shrink-0 w-16 h-24 rounded overflow-hidden border-2 transition ${index === currentPage ? 'border-primary' : 'border-transparent'
                                    }`}
                            >
                                <img
                                    src={page.content}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}


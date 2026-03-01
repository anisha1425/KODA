import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { booksApi } from '../../lib/api';

interface MangaDexChapter {
    id: string;
    chapter: string;
    title: string;
    volume: string | null;
    pages: number;
    group: string;
}

function MangaDexInlineReader({ book, bookId }: { book: { _id: string; title: string; authorName: string; mangadexId?: string; externalUrl?: string }; bookId: string }) {
    const [chapters, setChapters] = useState<MangaDexChapter[]>([]);
    const [chaptersLoading, setChaptersLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<MangaDexChapter | null>(null);
    const [pageUrls, setPageUrls] = useState<string[]>([]);
    const [pagesLoading, setPagesLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [viewMode, setViewMode] = useState<'single' | 'scroll'>('single');
    const [showChapterList, setShowChapterList] = useState(false);

    // Fetch chapter list
    useEffect(() => {
        const fetchChapters = async () => {
            try {
                setChaptersLoading(true);
                const res = await booksApi.getMangadexChapters(bookId);
                setChapters(res.data.chapters);
            } catch (err) {
                console.error('Failed to fetch chapters:', err);
            } finally {
                setChaptersLoading(false);
            }
        };
        fetchChapters();
    }, [bookId]);

    // Load pages when a chapter is selected
    const loadChapter = useCallback(async (chapter: MangaDexChapter) => {
        try {
            setPagesLoading(true);
            setSelectedChapter(chapter);
            setCurrentPage(0);
            setShowChapterList(false);
            const res = await booksApi.getMangadexPages(bookId, chapter.id);
            setPageUrls(res.data.pages);
        } catch (err) {
            console.error('Failed to fetch pages:', err);
        } finally {
            setPagesLoading(false);
        }
    }, [bookId]);

    // Auto-load first chapter
    useEffect(() => {
        if (chapters.length > 0 && !selectedChapter) {
            loadChapter(chapters[0]);
        }
    }, [chapters, selectedChapter, loadChapter]);

    const goToPage = useCallback((page: number) => {
        if (page >= 0 && page < pageUrls.length) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    }, [pageUrls.length]);

    // Navigate to next/prev chapter
    const goToChapter = useCallback((direction: 'next' | 'prev') => {
        if (!selectedChapter) return;
        const idx = chapters.findIndex(c => c.id === selectedChapter.id);
        const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
        if (nextIdx >= 0 && nextIdx < chapters.length) {
            loadChapter(chapters[nextIdx]);
        }
    }, [selectedChapter, chapters, loadChapter]);

    // Keyboard navigation
    useEffect(() => {
        if (!selectedChapter || pageUrls.length === 0) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') goToPage(currentPage - 1);
            else if (e.key === 'ArrowRight' || e.key === 'd') goToPage(currentPage + 1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, goToPage, selectedChapter, pageUrls.length]);

    // Chapter list view
    if (!selectedChapter || chaptersLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <header className="bg-black/90 backdrop-blur-sm z-50 flex-shrink-0">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <Link to={`/book/${bookId}`} className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                            <span className="material-icons-outlined">arrow_back</span>
                            <span className="hidden sm:inline truncate max-w-[200px]">{book.title}</span>
                        </Link>
                        <span className="px-3 py-1 bg-pink-600/80 text-white text-xs font-medium rounded-full">
                            MangaDex
                        </span>
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center">
                    {chaptersLoading ? (
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading chapters...</p>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <p>No chapters found.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const chapterIdx = chapters.findIndex(c => c.id === selectedChapter.id);
    const hasPrev = chapterIdx > 0;
    const hasNext = chapterIdx < chapters.length - 1;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to={`/book/${bookId}`} className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <span className="material-icons-outlined">arrow_back</span>
                        <span className="hidden sm:inline truncate max-w-[200px]">{book.title}</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {/* Chapter selector */}
                        <button
                            onClick={() => setShowChapterList(!showChapterList)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-pink-600/30 hover:bg-pink-600/50 rounded-lg text-sm transition"
                        >
                            <span className="material-icons-outlined text-sm">list</span>
                            Ch. {selectedChapter.chapter}
                        </button>

                        {/* Page indicator */}
                        <span className="text-sm text-gray-400">
                            {currentPage + 1} / {pageUrls.length}
                        </span>

                        {/* View toggle */}
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

            {/* Chapter list dropdown */}
            {showChapterList && (
                <div className="fixed top-14 right-4 w-80 max-h-[70vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-bold text-gray-200">Chapters ({chapters.length})</h3>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {chapters.map(ch => (
                            <button
                                key={ch.id}
                                onClick={() => loadChapter(ch)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition text-sm cursor-pointer ${ch.id === selectedChapter.id ? 'bg-pink-600/20 border-l-2 border-pink-500' : ''}`}
                            >
                                <span className="font-medium">Ch. {ch.chapter}</span>
                                {ch.title && ch.title !== `Chapter ${ch.chapter}` && (
                                    <span className="text-gray-400 ml-2 truncate">— {ch.title}</span>
                                )}
                                <br />
                                <span className="text-xs text-gray-500">{ch.pages} pages • {ch.group}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="pt-16 pb-20">
                {pagesLoading ? (
                    <div className="flex items-center justify-center min-h-[calc(100vh-9rem)]">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading pages...</p>
                        </div>
                    </div>
                ) : viewMode === 'single' ? (
                    <div className="flex items-center justify-center min-h-[calc(100vh-9rem)]">
                        <div className="relative w-full max-w-4xl mx-auto">
                            {pageUrls[currentPage] && (
                                <img
                                    src={pageUrls[currentPage]}
                                    alt={`Page ${currentPage + 1}`}
                                    className="w-full h-auto max-h-[85vh] object-contain mx-auto"
                                />
                            )}

                            {/* Click navigation areas */}
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-start pl-4 disabled:cursor-default cursor-pointer"
                            >
                                {currentPage > 0 && (
                                    <span className="bg-black/50 p-2 rounded-full">
                                        <span className="material-icons-outlined text-3xl">chevron_left</span>
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= pageUrls.length - 1}
                                className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0 hover:opacity-100 flex items-center justify-end pr-4 disabled:cursor-default cursor-pointer"
                            >
                                {currentPage < pageUrls.length - 1 && (
                                    <span className="bg-black/50 p-2 rounded-full">
                                        <span className="material-icons-outlined text-3xl">chevron_right</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto px-4 space-y-1">
                        {pageUrls.map((url, index) => (
                            <img key={index} src={url} alt={`Page ${index + 1}`} className="w-full h-auto" loading="lazy" />
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm py-3 px-4 z-50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        {/* Prev chapter */}
                        <button
                            onClick={() => goToChapter('prev')}
                            disabled={!hasPrev}
                            className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-30 disabled:cursor-default cursor-pointer"
                            title="Previous chapter"
                        >
                            <span className="material-icons-outlined">skip_previous</span>
                        </button>

                        {/* Page slider */}
                        <input
                            type="range"
                            min={0}
                            max={Math.max(pageUrls.length - 1, 0)}
                            value={currentPage}
                            onChange={(e) => goToPage(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />

                        {/* Next chapter */}
                        <button
                            onClick={() => goToChapter('next')}
                            disabled={!hasNext}
                            className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-30 disabled:cursor-default cursor-pointer"
                            title="Next chapter"
                        >
                            <span className="material-icons-outlined">skip_next</span>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

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
    source: 'user' | 'gutenberg' | 'internet_archive' | 'mangadex';
    archiveId?: string;
    mangadexId?: string;
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
    const isMangadexComic = book?.source === 'mangadex' && book?.mangadexId;

    useEffect(() => {
        if (!bookId) return;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const bookRes = await booksApi.getById(bookId);
                setBook(bookRes.data);

                // Only fetch chapters/pages for local (user-uploaded) comics
                if (bookRes.data.source !== 'internet_archive' && bookRes.data.source !== 'mangadex') {
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

    // Keyboard navigation (only for local comics)
    useEffect(() => {
        if (isArchiveComic || isMangadexComic) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                goToPage(currentPage + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, goToPage, isArchiveComic, isMangadexComic]);

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

    // MangaDex inline reader
    if (isMangadexComic) {
        return <MangaDexInlineReader book={book} bookId={bookId!} />;
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


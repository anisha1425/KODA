import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { SUPPORTED_LANGUAGES } from '../../lib/constants';
import BookCard from '../../components/ui/BookCard';

interface Book {
    _id: string;
    title: string;
    authorName: string;
    coverUrl?: string;
    contentType: 'novel' | 'comic';
    language: string;
    genres: string[];
    views: number;
    likes: number;
    source?: 'user' | 'gutenberg' | 'internet_archive';
    externalUrl?: string;
}

interface SearchResult {
    books: Book[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}


const GENRES = [
    { code: '', label: 'All Genres' },
    { code: 'fantasy', label: 'Fantasy' },
    { code: 'sci-fi', label: 'Sci-Fi' },
    { code: 'romance', label: 'Romance' },
    { code: 'mystery', label: 'Mystery' },
    { code: 'thriller', label: 'Thriller' },
    { code: 'action', label: 'Action' },
    { code: 'comedy', label: 'Comedy' },
];

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'popular', label: 'Most Viewed' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'recent', label: 'Recent' },
];

export default function SearchPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [results, setResults] = useState<SearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

    // Get filters from URL
    const query = searchParams.get('q') || '';
    const contentType = searchParams.get('type') || '';
    const language = searchParams.get('lang') || '';
    const genre = searchParams.get('genre') || '';
    const sortBy = searchParams.get('sort') || 'relevance';
    const page = Number(searchParams.get('page')) || 1;

    const fetchResults = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 20 };
            if (query) params.q = query;
            if (contentType) params.contentType = contentType;
            if (language) params.language = language;
            if (genre) params.genre = genre;
            if (sortBy) params.sortBy = sortBy;

            const response = await api.get<SearchResult>('/search', { params });
            setResults(response.data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [query, contentType, language, genre, sortBy, page]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const updateFilter = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }

        // Reset to page 1 for filter changes, but not when changing the page itself
        if (key !== 'page') {
            newParams.set('page', '1');
        }

        setSearchParams(newParams);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter('q', searchInput);
    };

    return (
        <div className="min-h-screen bg-background-light">
            {/* Search Header */}
            <div className="bg-gradient-to-b from-primary/10 to-transparent py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-display font-bold text-text-main-light mb-6">
                        {t('search.title', 'Discover Stories')}
                    </h1>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="max-w-2xl">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t('search.placeholder', 'Search by title, author...')}
                                className="w-full px-5 py-4 pr-14 rounded-xl border border-gray-200 bg-white text-text-main-light focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition"
                            >
                                <span className="material-icons-outlined">search</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Filters & Results */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            {/* Content Type */}
                            <div>
                                <h3 className="font-semibold text-text-main-light mb-3">Type</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['', 'novel', 'comic'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => updateFilter('type', type)}
                                            className={`px-4 py-2 rounded-full text-sm transition ${contentType === type
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-text-muted-light hover:bg-gray-200'
                                                }`}
                                        >
                                            {type === '' ? 'All' : type === 'novel' ? 'Novels' : 'Comics'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language Filter */}
                            <div>
                                <h3 className="font-semibold text-text-main-light mb-3">Language</h3>
                                <select
                                    value={language}
                                    onChange={(e) => updateFilter('lang', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-text-main-light"
                                >
                                    <option value="">All Languages</option>
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Genre Filter */}
                            <div>
                                <h3 className="font-semibold text-text-main-light mb-3">Genre</h3>
                                <select
                                    value={genre}
                                    onChange={(e) => updateFilter('genre', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-text-main-light"
                                >
                                    {GENRES.map((g) => (
                                        <option key={g.code} value={g.code}>{g.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort */}
                            <div>
                                <h3 className="font-semibold text-text-main-light mb-3">Sort By</h3>
                                <select
                                    value={sortBy}
                                    onChange={(e) => updateFilter('sort', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-text-main-light"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </aside>

                    {/* Results */}
                    <main className="flex-1">
                        {/* Results count */}
                        {results && (
                            <div className="mb-6 text-text-muted-light">
                                {results.pagination.total} {results.pagination.total === 1 ? 'result' : 'results'}
                                {query && ` for "${query}"`}
                            </div>
                        )}

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {/* Results Grid */}
                        {!isLoading && results && (
                            <>
                                {results.books.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {results.books.map((book) => (
                                            <BookCard
                                                key={book._id}
                                                id={book._id}
                                                title={book.title}
                                                author={book.authorName}
                                                coverUrl={book.coverUrl}
                                                genre={book.genres[0] || 'General'}
                                                badge={book.contentType === 'comic' ? 'COMIC' : undefined}
                                                source={book.source}
                                                contentType={book.contentType}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <span className="material-icons-outlined text-6xl text-gray-300 mb-4">search_off</span>
                                        <p className="text-text-muted-light">No results found</p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {results.pagination.totalPages > 1 && (() => {
                                    const totalPages = results.pagination.totalPages;
                                    const pages: (number | '...')[] = [];

                                    // Build smart page window: 1 ... [current-2 to current+2] ... last
                                    if (totalPages <= 7) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        pages.push(1);
                                        if (page > 4) pages.push('...');
                                        const start = Math.max(2, page - 2);
                                        const end = Math.min(totalPages - 1, page + 2);
                                        for (let i = start; i <= end; i++) pages.push(i);
                                        if (page < totalPages - 3) pages.push('...');
                                        pages.push(totalPages);
                                    }

                                    return (
                                        <div className="flex justify-center items-center gap-1.5 mt-10">
                                            {/* First */}
                                            <button
                                                onClick={() => updateFilter('page', '1')}
                                                disabled={page === 1}
                                                className="w-10 h-10 rounded-lg transition bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                                                title="First page"
                                            >
                                                <span className="material-icons-outlined text-sm">first_page</span>
                                            </button>
                                            {/* Prev */}
                                            <button
                                                onClick={() => updateFilter('page', String(page - 1))}
                                                disabled={page === 1}
                                                className="w-10 h-10 rounded-lg transition bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                                                title="Previous page"
                                            >
                                                <span className="material-icons-outlined text-sm">chevron_left</span>
                                            </button>

                                            {pages.map((p, idx) =>
                                                p === '...' ? (
                                                    <span key={`ellipsis-${idx}`} className="w-8 h-10 flex items-center justify-center text-gray-400 select-none">…</span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        onClick={() => updateFilter('page', String(p))}
                                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition ${page === p
                                                            ? 'bg-primary text-white shadow-sm'
                                                            : 'bg-gray-100 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            )}

                                            {/* Next */}
                                            <button
                                                onClick={() => updateFilter('page', String(page + 1))}
                                                disabled={page === totalPages}
                                                className="w-10 h-10 rounded-lg transition bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                                                title="Next page"
                                            >
                                                <span className="material-icons-outlined text-sm">chevron_right</span>
                                            </button>
                                            {/* Last */}
                                            <button
                                                onClick={() => updateFilter('page', String(totalPages))}
                                                disabled={page === totalPages}
                                                className="w-10 h-10 rounded-lg transition bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                                                title="Last page"
                                            >
                                                <span className="material-icons-outlined text-sm">last_page</span>
                                            </button>
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

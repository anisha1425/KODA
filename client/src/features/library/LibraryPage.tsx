import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trash2, Eye, BookmarkCheck } from 'lucide-react';
import { libraryApi } from '@/lib/api';

interface LibraryItem {
    _id: string;
    bookId: {
        _id: string;
        title: string;
        coverUrl?: string;
        authorName: string;
        contentType: string;
        views: number;
        likes: number;
    } | null;
    status: string;
    addedAt: string;
    readingProgress?: {
        chapterIndex: number;
        percentage: number;
    } | null;
}

const STATUS_LABELS: Record<string, string> = {
    want_to_read: '📖 Want to Read',
    reading: '📚 Reading',
    completed: '✅ Completed',
    dropped: '❌ Dropped',
};

const STATUS_COLORS: Record<string, string> = {
    want_to_read: 'bg-blue-100 text-blue-700',
    reading: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    dropped: 'bg-red-100 text-red-700',
};

export default function LibraryPage() {
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const fetchLibrary = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = { page: 1, limit: 50 };
            if (activeFilter !== 'all') params.status = activeFilter;
            const res = await libraryApi.getAll(params);
            setItems(res.data.items || []);
        } catch (err) {
            console.error('Failed to load library:', err);
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const handleRemove = async (bookId: string) => {
        try {
            await libraryApi.remove(bookId);
            setItems(prev => prev.filter(item => item.bookId?._id !== bookId));
        } catch (err) {
            console.error('Failed to remove:', err);
        }
    };

    const handleStatusChange = async (bookId: string, newStatus: string) => {
        try {
            await libraryApi.update(bookId, { status: newStatus });
            setItems(prev => prev.map(item =>
                item.bookId?._id === bookId ? { ...item, status: newStatus } : item
            ));
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const filters = ['all', 'want_to_read', 'reading', 'completed', 'dropped'];

    return (
        <div className="min-h-screen bg-background-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <BookmarkCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-text-main-light">My Library</h1>
                        <p className="text-sm text-text-muted-light">Your personal reading collection</p>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === f
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-card-light text-text-muted-light hover:bg-gray-100 border border-border-light'
                                }`}
                        >
                            {f === 'all' ? 'All' : STATUS_LABELS[f]?.replace(/^.+\s/, '') || f}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-36 rounded-xl bg-gray-200 animate-pulse" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="mx-auto h-16 w-16 text-text-muted-light/30 mb-4" />
                        <h3 className="font-display text-xl font-semibold text-text-main-light mb-2">
                            {activeFilter === 'all' ? 'Your library is empty' : 'No books with this status'}
                        </h3>
                        <p className="text-text-muted-light mb-6">Start exploring and add books to your collection!</p>
                        <Link
                            to="/search"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                        >
                            Browse Books
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.filter((item): item is LibraryItem & { bookId: NonNullable<LibraryItem['bookId']> } => !!item.bookId).map(item => (
                            <div
                                key={item._id}
                                className="flex gap-4 p-4 rounded-xl bg-card-light border border-border-light hover:shadow-md transition-shadow"
                            >
                                {/* Cover */}
                                <Link to={`/book/${item.bookId._id}`} className="flex-shrink-0">
                                    {item.bookId.coverUrl ? (
                                        <img
                                            src={item.bookId.coverUrl}
                                            alt={item.bookId.title}
                                            className="w-20 h-28 rounded-lg object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-white/80" />
                                        </div>
                                    )}
                                </Link>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <Link to={`/book/${item.bookId._id}`}>
                                        <h3 className="font-display font-semibold text-text-main-light line-clamp-1 hover:text-primary transition-colors">
                                            {item.bookId.title}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-text-muted-light mt-0.5">{item.bookId.authorName}</p>

                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {STATUS_LABELS[item.status] || item.status}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusChange(item.bookId._id, e.target.value)}
                                            className="text-xs px-2 py-1 rounded border border-border-light bg-background-light text-text-main-light"
                                        >
                                            <option value="want_to_read">Want to Read</option>
                                            <option value="reading">Reading</option>
                                            <option value="completed">Completed</option>
                                            <option value="dropped">Dropped</option>
                                        </select>

                                        {item.readingProgress && (
                                            <Link
                                                to={`/read/${item.bookId._id}`}
                                                className="p-1 px-2 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors flex items-center gap-1"
                                                title={`Continue from Chapter ${item.readingProgress.chapterIndex + 1}`}
                                            >
                                                <BookOpen className="h-3 w-3" />
                                                <span>{item.readingProgress.percentage > 0 ? `${Math.round(item.readingProgress.percentage)}%` : 'Continue'}</span>
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => handleRemove(item.bookId._id)}
                                            className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors ml-auto sm:ml-0"
                                            title="Remove from library"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-text-muted-light">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {item.bookId.views}
                                    </span>
                                    <span className="capitalize text-[10px]">{item.bookId.contentType}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

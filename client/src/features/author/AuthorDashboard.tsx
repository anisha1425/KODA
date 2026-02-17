import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { authorApi } from '../../lib/api';
import { useAuthStore } from '../auth/authStore';

type TabId = 'dashboard' | 'stories' | 'analytics' | 'comments' | 'reviews' | 'earnings';

const sidebarLinks: { icon: string; label: string; tab: TabId }[] = [
    { icon: 'dashboard', label: 'Dashboard', tab: 'dashboard' },
    { icon: 'auto_stories', label: 'My Stories', tab: 'stories' },
    { icon: 'analytics', label: 'Analytics', tab: 'analytics' },
    { icon: 'chat_bubble_outline', label: 'Comments', tab: 'comments' },
    { icon: 'star_outline', label: 'Reviews', tab: 'reviews' },
    { icon: 'attach_money', label: 'Earnings', tab: 'earnings' },
];

interface Stats {
    totalBooks: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalReviews: number;
}

interface Work {
    _id: string;
    title: string;
    description?: string;
    contentType: string;
    language: string;
    genres: string[];
    status: string;
    isPublic: boolean;
    views: number;
    likes: number;
    totalChapters: number;
    coverUrl?: string;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
}

interface AuthorComment {
    _id: string;
    bookId: string;
    bookTitle: string;
    userName: string;
    userAvatar?: string;
    content: string;
    likes: number;
    createdAt: string;
}

interface AuthorReview {
    _id: string;
    bookId: string;
    bookTitle: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    content?: string;
    createdAt: string;
}

// Edit Modal Component
function EditBookModal({ book, onClose, onSave }: {
    book: Work;
    onClose: () => void;
    onSave: (id: string, data: { title: string; description: string; genres: string[]; language: string }) => Promise<void>;
}) {
    const [form, setForm] = useState({
        title: book.title,
        description: book.description || '',
        genres: book.genres || [],
        language: book.language,
    });
    const [saving, setSaving] = useState(false);
    const [genreInput, setGenreInput] = useState('');

    const availableGenres = ['romance', 'fantasy', 'thriller', 'sci-fi', 'mystery', 'horror', 'action', 'adventure', 'comedy', 'drama', 'historical', 'non-fiction'];

    const handleAddGenre = (genre: string) => {
        if (form.genres.length < 3 && !form.genres.includes(genre)) {
            setForm({ ...form, genres: [...form.genres, genre] });
        }
        setGenreInput('');
    };

    const handleRemoveGenre = (genre: string) => {
        setForm({ ...form, genres: form.genres.filter(g => g !== genre) });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(book._id, form);
            onClose();
        } catch (e) {
            console.error('Save error:', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="font-display text-xl font-bold">Edit Book</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description
                            <span className="text-xs text-text-muted-light ml-2">{form.description.length}/2000</span>
                        </label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value.slice(0, 2000) })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light focus:ring-1 focus:ring-primary focus:border-primary text-sm resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Genres <span className="text-xs text-text-muted-light">(max 3)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {form.genres.map(g => (
                                <span key={g} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                                    {g}
                                    <button onClick={() => handleRemoveGenre(g)} className="hover:text-red-500 cursor-pointer">×</button>
                                </span>
                            ))}
                        </div>
                        {form.genres.length < 3 && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={genreInput}
                                    onChange={e => setGenreInput(e.target.value)}
                                    placeholder="Add a genre..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                {genreInput && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                                        {availableGenres
                                            .filter(g => g.includes(genreInput.toLowerCase()) && !form.genres.includes(g))
                                            .map(g => (
                                                <button
                                                    key={g}
                                                    onClick={() => handleAddGenre(g)}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 capitalize cursor-pointer"
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Language</label>
                        <select
                            value={form.language}
                            onChange={e => setForm({ ...form, language: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light text-sm cursor-pointer"
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                    <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.title}
                        className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AuthorDashboard() {
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Data state
    const [stats, setStats] = useState<Stats | null>(null);
    const [works, setWorks] = useState<Work[]>([]);
    const [comments, setComments] = useState<AuthorComment[]>([]);
    const [commentsTotal, setCommentsTotal] = useState(0);
    const [commentsPage, setCommentsPage] = useState(1);

    // Reviews state
    const [reviews, setReviews] = useState<AuthorReview[]>([]);
    const [reviewsTotal, setReviewsTotal] = useState(0);
    const [reviewsPage, setReviewsPage] = useState(1);

    const [loading, setLoading] = useState(false);

    // Edit state
    const [editingBook, setEditingBook] = useState<Work | null>(null);

    // Search/filter state
    const [storySearch, setStorySearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Upload form state
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [uploadForm, setUploadForm] = useState({ title: '', description: '', genres: [] as string[], language: 'en' });
    const [bookFile, setBookFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadGenreInput, setUploadGenreInput] = useState('');

    const availableGenres = ['romance', 'fantasy', 'thriller', 'sci-fi', 'mystery', 'horror', 'action', 'adventure', 'comedy', 'drama', 'historical', 'non-fiction'];

    const fetchStats = useCallback(async () => {
        try {
            const res = await authorApi.getStats();
            setStats(res.data);
        } catch (e) { console.error('Stats error:', e); }
    }, []);

    const fetchWorks = useCallback(async () => {
        try {
            setLoading(true);
            const res = await authorApi.getWorks();
            setWorks(res.data.works);
        } catch (e) { console.error('Works error:', e); }
        finally { setLoading(false); }
    }, []);

    const fetchComments = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const res = await authorApi.getComments({ page });
            setComments(res.data.comments);
            setCommentsTotal(res.data.total);
            setCommentsPage(res.data.page);
        } catch (e) { console.error('Comments error:', e); }
        finally { setLoading(false); }
    }, []);

    const fetchReviews = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const res = await authorApi.getReviews({ page });
            setReviews(res.data.reviews);
            setReviewsTotal(res.data.total);
            setReviewsPage(res.data.page);
        } catch (e) { console.error('Reviews error:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchWorks();
    }, [fetchStats, fetchWorks]);

    useEffect(() => {
        if (activeTab === 'comments') fetchComments();
        if (activeTab === 'reviews') fetchReviews();
    }, [activeTab, fetchComments, fetchReviews]);

    // Close sidebar on tab change (mobile)
    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        setSidebarOpen(false);
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleBookFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            const allowed = ['epub', 'cbz', 'cbr', 'pdf', 'zip'];
            if (ext && allowed.includes(ext)) {
                setBookFile(file);
            } else {
                alert('Invalid file format. Please upload EPUB, CBZ, CBR, or PDF.');
                e.target.value = ''; // Reset input
            }
        }
    };

    const handleCreateDraft = async () => {
        if (!uploadForm.title || !bookFile) return;
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('description', uploadForm.description);
            formData.append('language', uploadForm.language);
            if (uploadForm.genres.length > 0) formData.append('genres', JSON.stringify(uploadForm.genres));
            formData.append('file', bookFile);
            if (coverFile) formData.append('cover', coverFile);

            await authorApi.createBook(formData);
            setUploadForm({ title: '', description: '', genres: [], language: 'en' });
            setCoverPreview(null);
            setCoverFile(null);
            setBookFile(null);
            setUploadGenreInput('');
            fetchStats();
            fetchWorks();
            setActiveTab('stories');
        } catch (e) { console.error('Upload error:', e); }
        finally { setUploading(false); }
    };

    const handleEditBook = async (bookId: string, data: { title: string; description: string; genres: string[]; language: string }) => {
        await authorApi.updateBook(bookId, data);
        fetchWorks();
    };

    const handleTogglePublish = async (bookId: string) => {
        await authorApi.togglePublish(bookId);
        fetchWorks();
    };

    const handleDeleteBook = async (bookId: string) => {
        if (!confirm('Are you sure you want to delete this book? This cannot be undone.')) return;
        try {
            await authorApi.deleteBook(bookId);
            fetchWorks();
            fetchStats();
        } catch (e) { console.error('Delete error:', e); }
    };

    const formatNumber = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n.toString();
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            approved: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            rejected: 'bg-red-100 text-red-700',
            flagged: 'bg-orange-100 text-orange-700',
        };
        return map[status] || 'bg-gray-100 text-gray-700';
    };

    // Filtered works for story tab
    const filteredWorks = useMemo(() => {
        return works.filter(w => {
            const matchSearch = !storySearch || w.title.toLowerCase().includes(storySearch.toLowerCase());
            const matchStatus = statusFilter === 'all' || w.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [works, storySearch, statusFilter]);

    // Helper to resolve image URLs
    const getImageUrl = (path?: string) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;
        // Use VITE_API_URL or default to localhost:5001
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        // Remove /api suffix if present to get base origin, or just use base if it's the root
        // If VITE_API_URL includes /api, we need to strip it to get to /uploads
        // Typically VITE_API_URL is http://localhost:5001/api
        const origin = baseUrl.replace('/api', '');
        return `${origin}${path}`;
    };

    // ─── RENDER TAB CONTENT ──────────────────────────

    const renderDashboard = () => (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
                {[
                    { icon: 'auto_stories', label: 'Total Books', value: stats?.totalBooks ?? 0, color: 'bg-blue-100 text-blue-600' },
                    { icon: 'visibility', label: 'Total Views', value: formatNumber(stats?.totalViews ?? 0), color: 'bg-green-100 text-green-600' },
                    { icon: 'favorite', label: 'Total Likes', value: formatNumber(stats?.totalLikes ?? 0), color: 'bg-red-100 text-red-600' },
                    { icon: 'chat_bubble', label: 'Comments', value: stats?.totalComments ?? 0, color: 'bg-orange-100 text-orange-600' },
                    { icon: 'star', label: 'Reviews', value: stats?.totalReviews ?? 0, color: 'bg-yellow-100 text-yellow-600' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-5 lg:p-6 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full ${stat.color} flex items-center justify-center mb-3 lg:mb-4`}>
                            <span className="material-icons-outlined text-lg lg:text-xl">{stat.icon}</span>
                        </div>
                        <p className="text-xs uppercase tracking-wide text-text-muted-light mb-1">{stat.label}</p>
                        <p className="text-2xl lg:text-3xl font-bold text-text-main-light">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Grid: Upload + Works */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Upload Form */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h2 className="font-display text-xl font-bold mb-4">Upload New Story</h2>
                    <p className="text-sm text-text-muted-light mb-6">Publish your next masterpiece to the world.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <span className="text-secondary font-bold mr-2">Step 1:</span>
                                Cover Image (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                {coverPreview ? (
                                    <div className="relative inline-block">
                                        <img src={coverPreview} alt="Cover preview" className="w-32 h-48 object-cover mx-auto rounded" />
                                        <button
                                            onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center cursor-pointer hover:bg-red-600"
                                        >×</button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-4xl text-gray-400 mb-2">cloud_upload</span>
                                        <p className="text-sm text-text-muted-light">
                                            <label className="text-primary cursor-pointer hover:underline">
                                                Upload a file
                                                <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                                            </label>{' '}
                                            or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <span className="text-secondary font-bold mr-2">Step 2:</span>
                                Book File (EPUB/CBZ)
                            </label>
                            <input type="file" accept="*" onChange={handleBookFileUpload}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary/10 file:text-primary cursor-pointer" />
                            {bookFile && <p className="text-xs text-green-600 mt-1">✓ {bookFile.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Story Title</label>
                            <input type="text" value={uploadForm.title}
                                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                placeholder="e.g. The Lady Beauty Scarlett"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light focus:ring-1 focus:ring-primary focus:border-primary text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Synopsis
                                <span className="text-xs text-text-muted-light ml-2">{uploadForm.description.length}/2000</span>
                            </label>
                            <textarea rows={3} value={uploadForm.description}
                                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value.slice(0, 2000) })}
                                placeholder="Brief description of your story..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light focus:ring-1 focus:ring-primary focus:border-primary text-sm resize-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Genres <span className="text-xs text-text-muted-light">(max 3)</span>
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {uploadForm.genres.map(g => (
                                    <span key={g} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                                        {g}
                                        <button onClick={() => setUploadForm({ ...uploadForm, genres: uploadForm.genres.filter(x => x !== g) })} className="hover:text-red-500 cursor-pointer">×</button>
                                    </span>
                                ))}
                            </div>
                            {uploadForm.genres.length < 3 && (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={uploadGenreInput}
                                        onChange={e => setUploadGenreInput(e.target.value)}
                                        placeholder="Type to add a genre..."
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                    {uploadGenreInput && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                                            {availableGenres
                                                .filter(g => g.includes(uploadGenreInput.toLowerCase()) && !uploadForm.genres.includes(g))
                                                .map(g => (
                                                    <button
                                                        key={g}
                                                        onClick={() => {
                                                            setUploadForm({ ...uploadForm, genres: [...uploadForm.genres, g] });
                                                            setUploadGenreInput('');
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 capitalize cursor-pointer"
                                                    >
                                                        {g}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Language</label>
                            <select value={uploadForm.language}
                                onChange={(e) => setUploadForm({ ...uploadForm, language: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light focus:ring-1 focus:ring-primary focus:border-primary text-sm cursor-pointer">
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>

                        <button onClick={handleCreateDraft} disabled={uploading || !uploadForm.title || !bookFile}
                            className="w-full px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            {uploading ? 'Uploading...' : 'Upload Book'}
                        </button>
                    </div>
                </div>

                {/* Published Works */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-display text-xl font-bold">My Published Works</h2>
                            <p className="text-sm text-text-muted-light">Manage your chapters and view reader feedback.</p>
                        </div>
                    </div>

                    {works.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-6 bg-primary/5 rounded-full flex items-center justify-center">
                                <span className="material-icons-outlined text-5xl text-primary/40">menu_book</span>
                            </div>
                            <h3 className="text-lg font-semibold text-text-main-light mb-2">Welcome to Author Studio!</h3>
                            <p className="text-sm text-text-muted-light max-w-md mx-auto mb-6">
                                Start your writing journey by uploading your first book. We support EPUB and CBZ formats.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                                {[
                                    { icon: 'upload_file', text: 'Upload EPUB/CBZ' },
                                    { icon: 'auto_fix_high', text: 'Auto-parsed chapters' },
                                    { icon: 'public', text: 'Reach global readers' },
                                ].map(tip => (
                                    <div key={tip.text} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
                                        <span className="material-icons-outlined text-2xl text-primary">{tip.icon}</span>
                                        <span className="text-xs text-text-muted-light text-center">{tip.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-text-muted-light border-b border-gray-100">
                                        <th className="pb-3">Book Details</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Stats</th>
                                        <th className="pb-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {works.slice(0, 5).map((work) => (
                                        <tr key={work._id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    {work.coverUrl ? (
                                                        <img src={getImageUrl(work.coverUrl)} alt="" className="w-10 h-14 object-cover rounded" />
                                                    ) : (
                                                        <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center">
                                                            <span className="material-icons-outlined text-gray-400 text-sm">auto_stories</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{work.title}</p>
                                                        <p className="text-xs text-text-muted-light">
                                                            {work.genres?.[0] || work.contentType} • {work.language.toUpperCase()}
                                                        </p>
                                                        <p className="text-xs text-text-muted-light">Updated {timeAgo(work.updatedAt)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${statusBadge(work.status)} inline-block w-fit`}>
                                                        {work.status}
                                                    </span>
                                                    <span className={`text-xs ${work.isPublic ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {work.isPublic ? '● Public' : '○ Draft'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <p className="text-sm font-medium">{formatNumber(work.views)} views</p>
                                                <p className="text-xs text-text-muted-light">{work.likes} likes</p>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setEditingBook(work)}
                                                        className="p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                                        title="Edit">
                                                        <span className="material-icons-outlined text-lg">edit</span>
                                                    </button>
                                                    <button onClick={() => handleTogglePublish(work._id)}
                                                        className={`p-2 transition-colors cursor-pointer ${work.isPublic ? 'text-green-400 hover:text-orange-500' : 'text-gray-400 hover:text-green-500'}`}
                                                        title={work.isPublic ? 'Unpublish' : 'Publish'}>
                                                        <span className="material-icons-outlined text-lg">
                                                            {work.isPublic ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                    <button onClick={() => handleDeleteBook(work._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                                        title="Delete">
                                                        <span className="material-icons-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {works.length > 5 && (
                                <button onClick={() => setActiveTab('stories')}
                                    className="mt-4 text-sm text-primary hover:underline cursor-pointer">
                                    View all {works.length} books →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderStories = () => (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="font-display text-2xl font-bold">All My Stories</h2>
                    <span className="text-sm text-text-muted-light">{filteredWorks.length} of {works.length} books</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                        <input
                            type="text"
                            value={storySearch}
                            onChange={e => setStorySearch(e.target.value)}
                            placeholder="Search stories..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-56"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="flagged">Flagged</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-text-muted-light">Loading...</div>
            ) : filteredWorks.length === 0 ? (
                <div className="text-center py-12 text-text-muted-light">
                    <span className="material-icons-outlined text-5xl mb-3">menu_book</span>
                    <p className="text-lg font-medium">{works.length === 0 ? 'No books yet' : 'No matching books'}</p>
                    <p className="text-sm">{works.length === 0 ? 'Go to Dashboard to upload your first story!' : 'Try adjusting your search or filters.'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredWorks.map((work) => (
                        <div key={work._id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-primary/30 transition-colors group">
                            {work.coverUrl ? (
                                <img src={getImageUrl(work.coverUrl)} alt="" className="w-16 h-24 object-cover rounded" />
                            ) : (
                                <div className="w-16 h-24 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="material-icons-outlined text-gray-400">auto_stories</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-lg truncate">{work.title}</h3>
                                <p className="text-sm text-text-muted-light">
                                    {work.contentType === 'comic' ? 'Comic' : 'Novel'} • {work.genres?.[0] || 'General'} • {work.language.toUpperCase()}
                                </p>
                                <p className="text-xs text-text-muted-light mt-1">
                                    {work.totalChapters} chapters • Created {timeAgo(work.createdAt)}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0 hidden sm:block">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${statusBadge(work.status)}`}>
                                        {work.status}
                                    </span>
                                    <span className={`text-xs ${work.isPublic ? 'text-green-600' : 'text-gray-400'}`}>
                                        {work.isPublic ? '● Public' : '○ Draft'}
                                    </span>
                                </div>
                                <div className="text-xs text-text-muted-light">
                                    <span>{formatNumber(work.views)} views</span>
                                    <span className="mx-2">•</span>
                                    <span>{work.likes} likes</span>
                                    <span className="mx-2">•</span>
                                    <span>{work.commentCount} comments</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => setEditingBook(work)}
                                    className="p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                    title="Edit">
                                    <span className="material-icons-outlined">edit</span>
                                </button>
                                <button onClick={() => handleTogglePublish(work._id)}
                                    className={`p-2 transition-colors cursor-pointer ${work.isPublic ? 'text-green-400 hover:text-orange-500' : 'text-gray-400 hover:text-green-500'}`}
                                    title={work.isPublic ? 'Unpublish' : 'Publish'}>
                                    <span className="material-icons-outlined">
                                        {work.isPublic ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                                <button onClick={() => handleDeleteBook(work._id)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                                    title="Delete book">
                                    <span className="material-icons-outlined">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAnalytics = () => (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
                    <span className="material-icons-outlined text-4xl text-blue-500 mb-2">visibility</span>
                    <p className="text-3xl font-bold">{formatNumber(stats?.totalViews ?? 0)}</p>
                    <p className="text-sm text-text-muted-light">Total Views</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
                    <span className="material-icons-outlined text-4xl text-red-500 mb-2">favorite</span>
                    <p className="text-3xl font-bold">{formatNumber(stats?.totalLikes ?? 0)}</p>
                    <p className="text-sm text-text-muted-light">Total Likes</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
                    <span className="material-icons-outlined text-4xl text-orange-500 mb-2">chat_bubble</span>
                    <p className="text-3xl font-bold">{stats?.totalComments ?? 0}</p>
                    <p className="text-sm text-text-muted-light">Total Comments</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
                    <span className="material-icons-outlined text-4xl text-yellow-500 mb-2">star</span>
                    <p className="text-3xl font-bold">{stats?.totalReviews ?? 0}</p>
                    <p className="text-sm text-text-muted-light">Total Reviews</p>
                </div>
            </div>

            {/* Per-book breakdown */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="font-display text-xl font-bold mb-6">Per-Book Performance</h2>
                {works.length === 0 ? (
                    <p className="text-center py-8 text-text-muted-light">No books to analyze</p>
                ) : (
                    <div className="space-y-4">
                        {works.map((work) => {
                            const maxViews = Math.max(...works.map(w => w.views), 1);
                            const barWidth = (work.views / maxViews) * 100;
                            return (
                                <div key={work._id} className="flex items-center gap-4">
                                    <p className="w-36 lg:w-48 text-sm font-medium truncate flex-shrink-0">{work.title}</p>
                                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                                        <div className="bg-primary/80 h-full rounded-full flex items-center px-3 transition-all"
                                            style={{ width: `${Math.max(barWidth, 5)}%` }}>
                                            <span className="text-xs text-gray-900 font-medium whitespace-nowrap">
                                                {formatNumber(work.views)} views
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-text-muted-light flex-shrink-0">
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons-outlined text-sm text-red-400">favorite</span>
                                            {work.likes}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-icons-outlined text-sm text-orange-400">chat_bubble</span>
                                            {work.commentCount}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    const renderComments = () => (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl font-bold">Reader Comments</h2>
                <span className="text-sm text-text-muted-light">{commentsTotal} total</span>
            </div>

            {loading ? (
                <div className="text-center py-12 text-text-muted-light">Loading...</div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 text-text-muted-light">
                    <span className="material-icons-outlined text-5xl mb-3">forum</span>
                    <p className="text-lg font-medium">No comments yet</p>
                    <p className="text-sm">When readers comment on your books, they'll appear here.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div key={comment._id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {comment.userName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-sm">{comment.userName}</span>
                                            <span className="text-xs text-text-muted-light">on</span>
                                            <span className="text-xs text-primary font-medium truncate">{comment.bookTitle}</span>
                                            <span className="text-xs text-text-muted-light ml-auto flex-shrink-0">{timeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-text-main-light">{comment.content}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-text-muted-light">
                                            <span className="material-icons-outlined text-sm">favorite</span>
                                            {comment.likes} likes
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {Math.ceil(commentsTotal / 20) > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: Math.min(Math.ceil(commentsTotal / 20), 5) }, (_, i) => (
                                <button key={i + 1} onClick={() => fetchComments(i + 1)}
                                    className={`w-8 h-8 rounded text-sm cursor-pointer ${commentsPage === i + 1 ? 'bg-primary text-white' : 'border border-gray-200 hover:border-primary hover:text-primary'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const renderReviews = () => (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl font-bold">Reader Reviews</h2>
                <span className="text-sm text-text-muted-light">{reviewsTotal} total</span>
            </div>

            {loading ? (
                <div className="text-center py-12 text-text-muted-light">Loading...</div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-text-muted-light">
                    <span className="material-icons-outlined text-5xl mb-3">star_outline</span>
                    <p className="text-lg font-medium">No reviews yet</p>
                    <p className="text-sm">When readers review your books, they'll appear here.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {review.userName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-sm">{review.userName}</span>
                                            <span className="text-xs text-text-muted-light">on</span>
                                            <span className="text-xs text-primary font-medium truncate">{review.bookTitle}</span>
                                            <span className="text-xs text-text-muted-light ml-auto flex-shrink-0">{timeAgo(review.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`material-icons-outlined text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>
                                                    star
                                                </span>
                                            ))}
                                        </div>
                                        {review.content && <p className="text-sm text-text-main-light">{review.content}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {Math.ceil(reviewsTotal / 20) > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: Math.min(Math.ceil(reviewsTotal / 20), 5) }, (_, i) => (
                                <button key={i + 1} onClick={() => fetchReviews(i + 1)}
                                    className={`w-8 h-8 rounded text-sm cursor-pointer ${reviewsPage === i + 1 ? 'bg-primary text-white' : 'border border-gray-200 hover:border-primary hover:text-primary'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );


    const renderEarnings = () => (
        <div className="bg-white rounded-xl p-6 border border-gray-100 text-center py-20">
            <span className="material-icons-outlined text-6xl text-gray-300 mb-4">account_balance_wallet</span>
            <h2 className="font-display text-2xl font-bold mb-2">Earnings</h2>
            <p className="text-text-muted-light mb-6 max-w-md mx-auto">
                The earnings feature is coming soon. You'll be able to track your revenue, payouts, and monetization metrics here.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <span className="material-icons-outlined text-lg">schedule</span>
                Coming Soon
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard': return renderDashboard();
            case 'stories': return renderStories();
            case 'analytics': return renderAnalytics();
            case 'comments': return renderComments();
            case 'reviews': return renderReviews();
            case 'earnings': return renderEarnings();
            default: return renderDashboard();
        }
    };

    const tabTitles: Record<TabId, string> = {
        dashboard: 'Author Dashboard',
        stories: 'My Stories',
        analytics: 'Analytics',
        comments: 'Reader Comments',
        reviews: 'Reviews',
        earnings: 'Earnings',
    };

    return (
        <div className="min-h-screen bg-background-light flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-gray-100 flex flex-col
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="material-icons-outlined text-primary text-2xl">auto_stories</span>
                        <span className="font-display font-bold text-xl">KODA</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded cursor-pointer">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {sidebarLinks.map((link) => (
                        <button
                            key={link.tab}
                            onClick={() => handleTabChange(link.tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === link.tab
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-text-muted-light hover:bg-gray-100'
                                }`}
                        >
                            <span className="material-icons-outlined text-xl">{link.icon}</span>
                            {link.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 space-y-1">
                    <Link to="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted-light hover:bg-gray-100 transition-colors">
                        <span className="material-icons-outlined text-xl">settings</span>
                        Settings
                    </Link>
                    <Link to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted-light hover:bg-gray-100 transition-colors">
                        <span className="material-icons-outlined text-xl">home</span>
                        Back to Home
                    </Link>
                    <button onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted-light hover:bg-gray-100 transition-colors cursor-pointer">
                        <span className="material-icons-outlined text-xl">logout</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 min-w-0">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            <span className="material-icons-outlined">menu</span>
                        </button>
                        <div>
                            <h1 className="font-display text-2xl lg:text-3xl font-bold text-text-main-light">
                                {tabTitles[activeTab]}
                            </h1>
                            <p className="text-text-muted-light text-sm lg:text-base">
                                Welcome back{user?.displayName ? `, ${user.displayName}` : ''}. Here is your daily overview.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 text-text-muted-light hover:text-primary transition-colors cursor-pointer">
                            <span className="material-icons-outlined">notifications</span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                            {user?.displayName?.[0]?.toUpperCase() || 'A'}
                        </div>
                    </div>
                </div>

                {renderTabContent()}
            </main>

            {/* Edit Book Modal */}
            {editingBook && (
                <EditBookModal
                    book={editingBook}
                    onClose={() => setEditingBook(null)}
                    onSave={handleEditBook}
                />
            )}
        </div>
    );
}

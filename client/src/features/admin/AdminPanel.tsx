import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { adminApi } from '../../lib/api';
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

type TabId = 'overview' | 'content' | 'reports' | 'authors' | 'import' | 'settings' | 'roles';

interface AdminStats {
    pendingReviews: number;
    reportedItems: number;
    approvedToday: number;
    totalUsers: number;
    totalAuthors: number;
}

interface PendingBook {
    _id: string;
    title: string;
    authorName: string;
    language: string;
    genres: string[];
    contentType: string;
    coverUrl?: string;
    createdAt: string;
    totalChapters: number;
}

interface ReportItem {
    _id: string;
    reportedBy: { _id: string; displayName: string; email: string; avatarUrl?: string } | null;
    targetType: 'book' | 'comment' | 'user';
    targetId: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'dismissed';
    adminNote?: string;
    createdAt: string;
}

interface AuthorItem {
    _id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
    bookCount: number;
}

interface UserItem {
    _id: string;
    displayName: string;
    email: string;
    role: string;
    avatarUrl?: string;
    createdAt: string;
}

const sidebarLinks: { icon: string; label: string; tab: TabId; hasBadge?: boolean }[] = [
    { icon: 'dashboard', label: 'Overview', tab: 'overview' },
    { icon: 'pending_actions', label: 'Content Queue', tab: 'content', hasBadge: true },
    { icon: 'report', label: 'User Reports', tab: 'reports', hasBadge: true },
    { icon: 'people', label: 'Authors', tab: 'authors' },
    { icon: 'cloud_download', label: 'Import', tab: 'import' },
];

const systemLinks: { icon: string; label: string; tab: TabId }[] = [
    { icon: 'settings', label: 'Global Settings', tab: 'settings' },
    { icon: 'admin_panel_settings', label: 'Admin Roles', tab: 'roles' },
];

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

const getAvatarUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '')}${url}`;
};

export default function AdminPanel() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    // --- Shared State ---
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Content Queue State ---
    const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([]);
    const [languageFilter, setLanguageFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('oldest');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // --- Reports State ---
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [reportStatusFilter, setReportStatusFilter] = useState('pending');
    const [reportsLoading, setReportsLoading] = useState(false);

    // --- Authors State ---
    const [authors, setAuthors] = useState<AuthorItem[]>([]);
    const [authorsLoading, setAuthorsLoading] = useState(false);

    // --- Users/Roles State ---
    const [users, setUsers] = useState<UserItem[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [roleFilter, setRoleFilter] = useState('');


    // --- Data Fetchers ---
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminApi.getStats();
            setStats(res.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchContentQueue = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminApi.getContentQueue({
                language: languageFilter || undefined,
                sort: sortOrder,
            });
            setPendingBooks(res.data.books);
        } catch (error) {
            console.error('Failed to load content queue:', error);
        } finally {
            setLoading(false);
        }
    }, [languageFilter, sortOrder]);

    const fetchReports = useCallback(async () => {
        try {
            setReportsLoading(true);
            const res = await adminApi.getReports({ status: reportStatusFilter });
            setReports(res.data.reports);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setReportsLoading(false);
        }
    }, [reportStatusFilter]);

    const fetchAuthors = useCallback(async () => {
        try {
            setAuthorsLoading(true);
            const res = await adminApi.getAuthors();
            setAuthors(res.data.authors);
        } catch (error) {
            console.error('Failed to load authors:', error);
        } finally {
            setAuthorsLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            const res = await adminApi.getUsers({ role: roleFilter || undefined });
            setUsers(res.data.users);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setUsersLoading(false);
        }
    }, [roleFilter]);

    // Fetch stats on mount, then fetch tab-specific data
    useEffect(() => { fetchStats(); }, [fetchStats]);

    useEffect(() => {
        if (activeTab === 'content') fetchContentQueue();
        if (activeTab === 'reports') fetchReports();
        if (activeTab === 'authors') fetchAuthors();
        if (activeTab === 'roles') fetchUsers();
    }, [activeTab, fetchContentQueue, fetchReports, fetchAuthors, fetchUsers]);

    // --- Actions ---
    const handleApprove = async (bookId: string) => {
        setActionLoading(bookId);
        try {
            await adminApi.approveBook(bookId);
            setPendingBooks(prev => prev.filter(b => b._id !== bookId));
            setStats(prev => prev ? { ...prev, pendingReviews: prev.pendingReviews - 1, approvedToday: prev.approvedToday + 1 } : prev);
        } catch (error) {
            console.error('Approve failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (bookId: string) => {
        setActionLoading(bookId);
        try {
            await adminApi.rejectBook(bookId);
            setPendingBooks(prev => prev.filter(b => b._id !== bookId));
            setStats(prev => prev ? { ...prev, pendingReviews: prev.pendingReviews - 1 } : prev);
        } catch (error) {
            console.error('Reject failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFlag = async (bookId: string) => {
        setActionLoading(bookId);
        try {
            await adminApi.flagBook(bookId);
            setPendingBooks(prev => prev.filter(b => b._id !== bookId));
            setStats(prev => prev ? { ...prev, pendingReviews: prev.pendingReviews - 1 } : prev);
        } catch (error) {
            console.error('Flag failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReviewReport = async (reportId: string, action: 'reviewed' | 'dismissed') => {
        setActionLoading(reportId);
        try {
            await adminApi.reviewReport(reportId, action);
            setReports(prev => prev.filter(r => r._id !== reportId));
            if (action === 'reviewed') {
                setStats(prev => prev ? { ...prev, reportedItems: prev.reportedItems - 1 } : prev);
            }
        } catch (error) {
            console.error('Review report failed:', error);
        } finally {
            setActionLoading(null);
        }
    };



    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // --- Badge values ---
    const getBadge = (tab: TabId): number => {
        if (tab === 'content') return stats?.pendingReviews || 0;
        if (tab === 'reports') return stats?.reportedItems || 0;
        return 0;
    };

    // --- Stat Cards ---
    const statCards = stats ? [
        { label: 'Pending Reviews', value: stats.pendingReviews, change: `${stats.totalAuthors} authors`, icon: 'pending', color: 'text-blue-600' },
        { label: 'Reported Items', value: stats.reportedItems, change: 'Needs attention', icon: 'flag', color: 'text-red-600' },
        { label: 'Approved Today', value: stats.approvedToday, change: 'Goal: 20/day', icon: 'check_circle', color: 'text-green-600' },
        { label: 'Total Users', value: stats.totalUsers, change: `${stats.totalAuthors} authors`, icon: 'groups', color: 'text-orange-600' },
    ] : [];

    // ==========================================
    //  TAB RENDERERS
    // ==========================================

    const renderStatsCards = () => (
        loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
                        <div className="h-8 bg-gray-200 rounded w-12" />
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                            if (stat.label === 'Pending Reviews') setActiveTab('content');
                            if (stat.label === 'Reported Items') setActiveTab('reports');
                            if (stat.label === 'Total Users') setActiveTab('roles');
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-text-muted-light">{stat.label}</p>
                            <span className={`material-icons-outlined ${stat.color}`}>{stat.icon}</span>
                        </div>
                        <p className="text-3xl font-bold text-text-main-light">{stat.value}</p>
                        <p className="text-xs text-primary mt-1">{stat.change}</p>
                    </div>
                ))}
            </div>
        )
    );

    // --- OVERVIEW ---
    const renderOverview = () => (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">Dashboard Overview</h1>
                    <p className="text-text-muted-light">Platform health at a glance.</p>
                </div>
                <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                    <span className="material-icons-outlined">refresh</span>
                </button>
            </div>
            {renderStatsCards()}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-display text-lg font-bold mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <button onClick={() => setActiveTab('content')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer">
                            <span className="material-icons-outlined text-blue-600">pending_actions</span>
                            <div>
                                <p className="font-medium text-sm">Review Content Queue</p>
                                <p className="text-xs text-text-muted-light">{stats?.pendingReviews || 0} items pending</p>
                            </div>
                        </button>
                        <button onClick={() => setActiveTab('reports')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer">
                            <span className="material-icons-outlined text-red-600">report</span>
                            <div>
                                <p className="font-medium text-sm">Check User Reports</p>
                                <p className="text-xs text-text-muted-light">{stats?.reportedItems || 0} reports pending</p>
                            </div>
                        </button>
                        <button onClick={() => setActiveTab('roles')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer">
                            <span className="material-icons-outlined text-orange-600">manage_accounts</span>
                            <div>
                                <p className="font-medium text-sm">Manage Users</p>
                                <p className="text-xs text-text-muted-light">{stats?.totalUsers || 0} registered users</p>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-display text-lg font-bold mb-4">Platform Summary</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-text-muted-light">Total Users</span>
                            <span className="font-bold text-text-main-light">{stats?.totalUsers ?? '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-text-muted-light">Authors</span>
                            <span className="font-bold text-text-main-light">{stats?.totalAuthors ?? '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-text-muted-light">Pending Content</span>
                            <span className="font-bold text-blue-600">{stats?.pendingReviews ?? '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-text-muted-light">Pending Reports</span>
                            <span className="font-bold text-red-600">{stats?.reportedItems ?? '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-text-muted-light">Approved Today</span>
                            <span className="font-bold text-green-600">{stats?.approvedToday ?? '—'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    // --- CONTENT QUEUE ---
    const renderContentQueue = () => (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">Content Moderation</h1>
                    <p className="text-text-muted-light">Manage submissions and reports.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-text-muted-light">
                        <span className="font-medium">Pending</span>
                        <span className="text-primary font-bold">{stats?.pendingReviews ?? '—'}</span>
                    </div>
                    <button onClick={fetchContentQueue} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                        <span className="material-icons-outlined">refresh</span>
                    </button>
                </div>
            </div>
            {renderStatsCards()}

            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="font-display text-xl font-bold">Pending Approval Queue</h2>
                            <p className="text-sm text-text-muted-light">New submissions requiring review</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer">
                                <option value="">All Languages</option>
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer">
                                <option value="oldest">Oldest First</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : pendingBooks.length === 0 ? (
                        <div className="text-center py-12 text-text-muted-light">
                            <span className="material-icons-outlined text-4xl mb-2 block">check_circle</span>
                            <p className="font-medium">All caught up!</p>
                            <p className="text-sm">No pending submissions to review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingBooks.map(book => (
                                <div key={book._id}
                                    className={`border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow ${actionLoading === book._id ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex gap-4">
                                        {book.coverUrl ? (
                                            <img src={book.coverUrl} alt={book.title} className="w-16 h-24 object-cover rounded-lg" />
                                        ) : (
                                            <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <span className="material-icons-outlined text-gray-400">auto_stories</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${book.contentType === 'comic' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {book.contentType === 'comic' ? 'Comic' : 'E-Book'}
                                            </span>
                                            <p className="text-xs text-text-muted-light mt-1">{timeAgo(book.createdAt)}</p>
                                            <h3 className="font-bold mt-1 line-clamp-1">{book.title}</h3>
                                            <p className="text-sm text-text-muted-light">by {book.authorName}</p>
                                            <p className="text-xs text-text-muted-light mt-1">
                                                <span className="material-icons-outlined text-xs align-middle mr-1">language</span>
                                                {book.language.toUpperCase()}
                                            </p>
                                            <p className="text-xs text-text-muted-light">
                                                <span className="material-icons-outlined text-xs align-middle mr-1">category</span>
                                                {book.genres.join(', ') || 'Uncategorized'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => handleReject(book._id)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:border-red-400 hover:text-red-500 transition-colors cursor-pointer">
                                            × Reject
                                        </button>
                                        <button onClick={() => handleFlag(book._id)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:border-orange-400 hover:text-orange-500 transition-colors cursor-pointer">
                                            <span className="material-icons-outlined text-sm align-middle">flag</span> Flag
                                        </button>
                                        <button onClick={() => handleApprove(book._id)}
                                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                                            ✓ Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // --- USER REPORTS ---
    const renderReports = () => (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">User Reports</h1>
                    <p className="text-text-muted-light">Review reported content and users.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer">
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                    <button onClick={fetchReports} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                        <span className="material-icons-outlined">refresh</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-6">
                    {reportsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 text-text-muted-light">
                            <span className="material-icons-outlined text-4xl mb-2 block">check_circle</span>
                            <p className="font-medium">No {reportStatusFilter} reports</p>
                            <p className="text-sm">Nothing to show here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map(report => (
                                <div key={report._id}
                                    className={`border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow ${actionLoading === report._id ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${report.targetType === 'book' ? 'bg-blue-500' :
                                                report.targetType === 'comment' ? 'bg-orange-500' : 'bg-red-500'
                                                }`}>
                                                <span className="material-icons-outlined text-lg">
                                                    {report.targetType === 'book' ? 'auto_stories' :
                                                        report.targetType === 'comment' ? 'comment' : 'person'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${report.targetType === 'book' ? 'bg-blue-100 text-blue-700' :
                                                        report.targetType === 'comment' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {report.targetType.charAt(0).toUpperCase() + report.targetType.slice(1)}
                                                    </span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        report.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-text-main-light">{report.reason}</p>
                                                {report.description && (
                                                    <p className="text-sm text-text-muted-light mt-1 italic">"{report.description}"</p>
                                                )}
                                                <p className="text-xs text-text-muted-light mt-1">
                                                    Reported by <strong>{report.reportedBy?.displayName || 'Unknown'}</strong> • {timeAgo(report.createdAt)}
                                                </p>
                                                <p className="text-xs text-text-muted-light">
                                                    Target ID: <code className="bg-gray-100 px-1 rounded text-xs">{report.targetId}</code>
                                                </p>
                                            </div>
                                        </div>
                                        {report.status === 'pending' && (
                                            <div className="flex gap-2 ml-4 shrink-0">
                                                <button onClick={() => handleReviewReport(report._id, 'dismissed')}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:border-gray-500 transition-colors cursor-pointer">
                                                    Dismiss
                                                </button>
                                                <button onClick={() => handleReviewReport(report._id, 'reviewed')}
                                                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                                                    Mark Reviewed
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // --- AUTHORS ---
    const renderAuthors = () => (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">Authors</h1>
                    <p className="text-text-muted-light">All registered authors on the platform.</p>
                </div>
                <button onClick={fetchAuthors} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                    <span className="material-icons-outlined">refresh</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100">
                {authorsLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : authors.length === 0 ? (
                    <div className="text-center py-12 text-text-muted-light">
                        <span className="material-icons-outlined text-4xl mb-2 block">person_off</span>
                        <p className="font-medium">No authors yet</p>
                        <p className="text-sm">Authors will appear here once users register as authors.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-text-muted-light">Author</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-text-muted-light">Email</th>
                                    <th className="text-center px-6 py-4 text-sm font-medium text-text-muted-light">Books</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-text-muted-light">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {authors.map(author => (
                                    <tr key={author._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {author.avatarUrl ? (
                                                    <img src={getAvatarUrl(author.avatarUrl)} alt={author.displayName} className="w-9 h-9 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                                        {author.displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-medium text-sm">{author.displayName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted-light">{author.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                {author.bookCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted-light">{formatDate(author.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );

    // --- GLOBAL SETTINGS ---
    const renderSettings = () => (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">Global Settings</h1>
                    <p className="text-text-muted-light">Platform configuration and information.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">info</span>
                        Platform Info
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-text-muted-light uppercase tracking-wide">Platform Name</label>
                            <p className="mt-1 px-4 py-2.5 bg-gray-50 rounded-lg text-sm font-medium">KODA</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted-light uppercase tracking-wide">Tagline</label>
                            <p className="mt-1 px-4 py-2.5 bg-gray-50 rounded-lg text-sm">KODA Platform — Novels & Comics</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted-light uppercase tracking-wide">Version</label>
                            <p className="mt-1 px-4 py-2.5 bg-gray-50 rounded-lg text-sm font-mono">1.0.0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">tune</span>
                        Content Configuration
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-text-muted-light uppercase tracking-wide">Supported Content Types</label>
                            <div className="mt-2 flex gap-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Novels</span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Comics</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted-light uppercase tracking-wide">Supported Languages</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <span key={lang.code} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                        {lang.code.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted-light uppercase tracking-wide">Content Sources</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">User Uploads</span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Project Gutenberg</span>
                                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Internet Archive</span>
                                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">MangaDex</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">security</span>
                        Security Settings
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm">Content Moderation</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm">NSFW Filtering</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm">User Registration</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Open</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons-outlined text-primary">genre</span>
                        Available Genres
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Horror', 'Action', 'Adventure', 'Comedy', 'Drama', 'Slice of Life'].map(g => (
                            <span key={g} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-text-main-light">
                                {g}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    // --- ADMIN ROLES / USER MANAGEMENT ---
    const renderRoles = () => (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">User Management</h1>
                    <p className="text-text-muted-light">Manage user roles and permissions.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer">
                        <option value="">All Roles</option>
                        <option value="reader">Readers</option>
                        <option value="author">Authors</option>
                        <option value="admin">Admins</option>
                    </select>
                    <button onClick={fetchUsers} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                        <span className="material-icons-outlined">refresh</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100">
                {usersLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-text-muted-light">
                        <span className="material-icons-outlined text-4xl mb-2 block">group_off</span>
                        <p className="font-medium">No users found</p>
                        <p className="text-sm">Try adjusting the role filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-text-muted-light">User</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-text-muted-light">Email</th>
                                    <th className="text-center px-6 py-4 text-sm font-medium text-text-muted-light">Current Role</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-text-muted-light">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {u.avatarUrl ? (
                                                    <img src={getAvatarUrl(u.avatarUrl)} alt={u.displayName} className="w-9 h-9 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                                        {u.displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-medium text-sm">{u.displayName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted-light">{u.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                u.role === 'author' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted-light">{formatDate(u.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );



    // --- IMPORT TAB ---
    const [importGutenbergId, setImportGutenbergId] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

    // MangaDex import state
    const [mangadexLimit, setMangadexLimit] = useState(50);
    const [mangadexLoading, setMangadexLoading] = useState(false);
    const [mangadexResult, setMangadexResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleImportGutenberg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importGutenbergId) return;

        setImportLoading(true);
        setImportResult(null);
        try {
            await adminApi.importGutenberg(importGutenbergId);
            setImportResult({ success: true, message: `Details for ID ${importGutenbergId} imported successfully!` });
            setImportGutenbergId('');
            fetchStats(); // Update stats
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setImportResult({ success: false, message: (err as any).response?.data?.message || 'Import failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleImportMangadex = async (type: 'manga' | 'manhwa') => {
        setMangadexLoading(true);
        setMangadexResult(null);
        const label = type === 'manga' ? 'Manga (Japanese)' : 'Manhwa (Korean)';
        try {
            await adminApi.importMangadex(type, mangadexLimit);
            setMangadexResult({ success: true, message: `${label} import started! Importing up to ${mangadexLimit} titles in the background.` });
            fetchStats();
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = (err as any).response?.data?.error || 'Import failed';
            setMangadexResult({ success: false, message: msg });
        } finally {
            setMangadexLoading(false);
        }
    };

    const renderImport = () => (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">Import Content</h1>
                    <p className="text-text-muted-light">Add new books to the platform from external sources.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Gutenberg Import */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <span className="material-icons-outlined">library_books</span>
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-bold">Project Gutenberg</h2>
                            <p className="text-sm text-text-muted-light">Import public domain ebooks by ID</p>
                        </div>
                    </div>

                    <form onSubmit={handleImportGutenberg} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main-light mb-1">Gutenberg ID</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={importGutenbergId}
                                    onChange={(e) => setImportGutenbergId(e.target.value)}
                                    placeholder="e.g. 1342"
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={importLoading || !importGutenbergId}
                                    className={`px-6 py-2 bg-primary text-white rounded-lg font-medium transition-all ${importLoading || !importGutenbergId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover shadow-md hover:shadow-lg cursor-pointer'}`}
                                >
                                    {importLoading ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                            <p className="text-xs text-text-muted-light mt-2">
                                Enter the numeric ID from the Gutenberg URL (e.g., gutenberg.org/ebooks/<b>1342</b>).
                            </p>
                        </div>

                        {importResult && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <span className="material-icons-outlined text-sm mt-0.5">
                                    {importResult.success ? 'check_circle' : 'error'}
                                </span>
                                <p className="text-sm font-medium">{importResult.message}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* MangaDex Import — Manga & Manhwa */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                            <span className="material-icons-outlined">auto_awesome</span>
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-bold">MangaDex</h2>
                            <p className="text-sm text-text-muted-light">Import manga (Japanese) & manhwa (Korean)</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main-light mb-1">Import Limit</label>
                            <select
                                value={mangadexLimit}
                                onChange={(e) => setMangadexLimit(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value={20}>20 titles</option>
                                <option value={50}>50 titles</option>
                                <option value={100}>100 titles</option>
                                <option value={200}>200 titles</option>
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleImportMangadex('manga')}
                                disabled={mangadexLoading}
                                className={`flex-1 px-4 py-2.5 bg-pink-600 text-white rounded-lg font-medium text-sm transition-all ${mangadexLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-700 shadow-md hover:shadow-lg cursor-pointer'}`}
                            >
                                {mangadexLoading ? 'Importing...' : '🇯🇵 Import Manga'}
                            </button>
                            <button
                                onClick={() => handleImportMangadex('manhwa')}
                                disabled={mangadexLoading}
                                className={`flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm transition-all ${mangadexLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 shadow-md hover:shadow-lg cursor-pointer'}`}
                            >
                                {mangadexLoading ? 'Importing...' : '🇰🇷 Import Manhwa'}
                            </button>
                        </div>

                        <p className="text-xs text-text-muted-light">
                            Only SFW content is imported. NSFW content is filtered at API level + keyword blocklist.
                        </p>

                        {mangadexResult && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${mangadexResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <span className="material-icons-outlined text-sm mt-0.5">
                                    {mangadexResult.success ? 'check_circle' : 'error'}
                                </span>
                                <p className="text-sm font-medium">{mangadexResult.message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    // --- TAB CONTENT SWITCHER ---
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'content': return renderContentQueue();
            case 'reports': return renderReports();
            case 'authors': return renderAuthors();
            case 'import': return renderImport();
            case 'settings': return renderSettings();
            case 'roles': return renderRoles();
            default: return renderOverview();
        }
    };

    return (
        <div className="min-h-screen bg-background-light flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="material-icons-outlined text-primary text-2xl">auto_stories</span>
                        <span className="font-display font-bold text-xl text-primary">KODA</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {sidebarLinks.map((link) => {
                        const badge = link.hasBadge ? getBadge(link.tab) : 0;
                        return (
                            <button
                                key={link.label}
                                onClick={() => setActiveTab(link.tab)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === link.tab
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-text-muted-light hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-outlined text-xl">{link.icon}</span>
                                    {link.label}
                                </div>
                                {badge > 0 && (
                                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full">
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="px-4 py-2">
                    <p className="text-xs uppercase tracking-wide text-text-muted-light font-medium px-4 mb-2">
                        System
                    </p>
                    {systemLinks.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => setActiveTab(link.tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === link.tab
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-text-muted-light hover:bg-gray-100'
                                }`}
                        >
                            <span className="material-icons-outlined text-xl">{link.icon}</span>
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* User */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                            {user?.displayName?.split(' ').map(n => n[0]).join('') || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{user?.displayName || 'Admin'}</p>
                            <p className="text-xs text-text-muted-light truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 rounded-lg text-text-muted-light hover:text-red-500 transition-colors cursor-pointer"
                            title="Logout"
                        >
                            <span className="material-icons-outlined text-xl">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {renderTabContent()}
            </main>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import { BookOpen, Calendar, Edit3, Grid, Layers, User as UserIcon, Settings, Heart, Eye } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../auth/authStore';

interface UserProfile {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    role: string;
    createdAt: string;
}

interface UserStats {
    booksRead: number;
    booksPublished: number;
    recentlyRead: {
        book: {
            _id: string;
            title: string;
            coverUrl?: string;
            contentType: string;
            authorName?: string;
        };
        percentage: number;
        lastReadAt: string;
    }[];
}

interface PublishedBook {
    _id: string;
    title: string;
    coverUrl?: string;
    contentType: string;
    views: number;
    likes: number;
    description?: string;
}

export default function ProfilePage() {
    const { userId } = useParams<{ userId?: string }>();
    const { user: currentUser, isAuthenticated, updateUser } = useAuthStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [books, setBooks] = useState<PublishedBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ displayName: '', bio: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
    const [previewBanner, setPreviewBanner] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState('overview');

    const isOwnProfile = !userId || (currentUser && userId === currentUser.id);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);

                if (isOwnProfile && isAuthenticated) {
                    // Fetch own profile
                    const [profileRes, statsRes] = await Promise.all([
                        api.get('/users/me'),
                        api.get('/users/me/stats'),
                    ]);
                    setProfile(profileRes.data);
                    setStats(statsRes.data);
                    setEditForm({
                        displayName: profileRes.data.displayName,
                        bio: profileRes.data.bio || '',
                    });
                } else if (userId) {
                    // Fetch public profile
                    const res = await api.get(`/users/${userId}`);
                    setProfile(res.data.user);
                    setBooks(res.data.books);
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [userId, isOwnProfile, isAuthenticated]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'avatar') {
                setAvatarFile(file);
                setPreviewAvatar(URL.createObjectURL(file));
            } else {
                setBannerFile(file);
                setPreviewBanner(URL.createObjectURL(file));
            }
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('displayName', editForm.displayName);
            formData.append('bio', editForm.bio);
            if (avatarFile) formData.append('avatar', avatarFile);
            if (bannerFile) formData.append('banner', bannerFile);

            const res = await api.put('/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setProfile(res.data);
            // Update auth store as well to reflect changes in navbar immediately
            updateUser({
                displayName: res.data.displayName,
                avatarUrl: res.data.avatarUrl
            });

            setIsEditing(false);
            setAvatarFile(null);
            setBannerFile(null);
            setPreviewAvatar(null);
            setPreviewBanner(null);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="text-center">
                    <UserIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-text-muted-light">User not found</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Grid },
        ...(isOwnProfile ? [{ id: 'library', label: 'Library', icon: Layers }] : []),
        ...((isOwnProfile ? stats?.booksPublished : books.length) ? [{ id: 'works', label: 'Works', icon: BookOpen }] : []),
        { id: 'about', label: 'About', icon: UserIcon },
    ];

    // Helper to construct full image URL
    const getImageUrl = (path: string | undefined) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path; // Already absolute
        // Assuming API is at /api, we need the root. 
        // If VITE_API_URL is http://localhost:5001/api, we want http://localhost:5001
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');
        return `${baseUrl}${path}`;
    };

    const displayBanner = previewBanner || getImageUrl(profile.bannerUrl);

    return (
        <div className="min-h-screen bg-background-light pb-20">
            {/* Banner Area */}
            <div className={`h-48 md:h-64 relative overflow-hidden group ${!displayBanner ? 'bg-gradient-to-r from-primary/80 to-accent/80' : ''}`}>
                {displayBanner ? (
                    <img src={displayBanner} alt="Profile Banner" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </>
                )}

                {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <label className="cursor-pointer flex flex-col items-center text-white">
                            <Edit3 className="h-8 w-8 mb-2" />
                            <span className="font-medium">Change Banner</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                        </label>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-20 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                        {/* Profile Image */}
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white p-1.5 shadow-xl">
                                <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400 relative">
                                    {(previewAvatar || profile.avatarUrl) ? (
                                        <img src={previewAvatar || getImageUrl(profile.avatarUrl)} alt={profile.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        profile.displayName.charAt(0).toUpperCase()
                                    )}

                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <label className="cursor-pointer flex flex-col items-center text-white p-2">
                                                <Edit3 className="h-6 w-6" />
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isOwnProfile && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-primary transition-colors md:hidden"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Profile Info & Actions */}
                        <div className="flex-1 min-w-0 pb-2 md:pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-gray-900 truncate max-w-lg">
                                        {profile.displayName}
                                    </h1>
                                    <p className="text-gray-600 font-medium flex items-center gap-2 mt-1">
                                        <span className="capitalize">{profile.role}</span>
                                        <span>•</span>
                                        <span>Joined {new Date(profile.createdAt).getFullYear()}</span>
                                    </p>
                                </div>

                                {isOwnProfile && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-full font-medium shadow-sm transition-all backdrop-blur-sm"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        <span>Edit Profile</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form Modal/Inline */}
                {isEditing && (
                    <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
                        <p className="text-sm text-gray-500 mb-6">Click on your avatar or banner above to change visuals.</p>
                        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
                                    Save Changes
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-4 mb-6 border-b border-border-light no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-muted-light hover:bg-white hover:text-text-main-light'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Left, 2 cols) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <>
                                {/* Activity / Stats */}
                                {isOwnProfile && stats && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.booksRead}</div>
                                            <div className="text-sm text-gray-500">Books Read</div>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center">
                                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{stats.booksPublished}</div>
                                            <div className="text-sm text-gray-500">Published</div>
                                        </div>
                                    </div>
                                )}

                                {/* Continue Reading */}
                                {isOwnProfile && stats && stats.recentlyRead.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                                        <h2 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <Layers className="h-5 w-5 text-primary" />
                                            Continue Reading
                                        </h2>
                                        <div className="space-y-4">
                                            {stats.recentlyRead.map((item) => (
                                                <Link
                                                    key={item.book._id}
                                                    to={`/read/${item.book._id}`}
                                                    className="group flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                                                >
                                                    <div className="w-14 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                                                        {item.book.coverUrl ? (
                                                            <img src={item.book.coverUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                                <BookOpen className="h-6 w-6 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                                                            {item.book.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mb-2">{item.book.authorName || 'Unknown Author'}</p>
                                                        <div className="w-full max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                                style={{ width: `${item.percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-400 mt-1">{item.percentage}% completed</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Works (Public) */}
                                {!isOwnProfile && books.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                                        <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Latest Works</h2>
                                        <div className="space-y-4">
                                            {books.slice(0, 3).map((book) => (
                                                <Link key={book._id} to={`/book/${book._id}`} className="flex gap-4 group">
                                                    <div className="w-16 h-24 bg-gray-200 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                        {book.coverUrl && <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{book.title}</h3>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {book.views}</span>
                                                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {book.likes}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{book.description || 'No description available.'}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* LIBRARY TAB (Preview) */}
                        {activeTab === 'library' && isOwnProfile && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-display font-bold text-gray-900">Your Library</h2>
                                    <Link to="/library" className="text-primary hover:text-primary/80 font-medium text-sm">View All</Link>
                                </div>

                                {stats && stats.recentlyRead.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {stats.recentlyRead.map((item) => (
                                            <Link key={item.book._id} to={`/book/${item.book._id}`} className="group">
                                                <div className="aspect-[2/3] bg-gray-200 rounded-xl overflow-hidden mb-3 relative shadow-sm group-hover:shadow-md transition-all">
                                                    {item.book.coverUrl && <img src={item.book.coverUrl} alt="" className="w-full h-full object-cover" />}
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                                                        <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }} />
                                                    </div>
                                                </div>
                                                <h3 className="font-medium text-gray-900 text-sm truncate group-hover:text-primary">{item.book.title}</h3>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>Your library is empty.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* WORKS TAB */}
                        {activeTab === 'works' && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                                <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Published Works</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {(isOwnProfile ? [] : books).map((book) => (
                                        <Link key={book._id} to={`/book/${book._id}`} className="group">
                                            <div className="aspect-[2/3] bg-gray-200 rounded-xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-all">
                                                {book.coverUrl && <img src={book.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                                            </div>
                                            <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">{book.title}</h3>
                                            <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {book.views}</span>
                                                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {book.likes}</span>
                                            </div>
                                        </Link>
                                    ))}
                                    {isOwnProfile && (
                                        <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="mb-4">You haven't published any books yet.</p>
                                            <Link to="/author" className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
                                                Start Writing
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ABOUT TAB */}
                        {activeTab === 'about' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-50">
                                <h2 className="text-xl font-display font-bold text-gray-900 mb-6">About {profile.displayName}</h2>
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    {profile.bio ? (
                                        <p className="whitespace-pre-line leading-relaxed text-base">{profile.bio}</p>
                                    ) : (
                                        <p className="italic text-gray-400">No bio provided yet.</p>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Joined</p>
                                            <p>{new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <UserIcon className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Role</p>
                                            <p className="capitalize">{profile.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="space-y-6">
                        {/* Quick Stats Sidebar (Mobile hidden usually, but good for Desktop) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Settings className="h-4 w-4 text-gray-400" />
                                Account Details
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Status</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500">Member Since</span>
                                    <span className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</span>
                                </div>
                                {profile.email && isOwnProfile && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium">{profile.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

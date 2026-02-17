import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { booksApi, reviewsApi, commentsApi, likesApi, libraryApi } from '@/lib/api';
import { useAuthStore } from '../auth/authStore';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import ReportModal from '@/components/ui/ReportModal';
import { AlertCircle, BookmarkPlus, Check } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface BookData {
    _id: string;
    title: string;
    authorName: string;
    description?: string;
    coverUrl?: string;
    language: string;
    genres: string[];
    views: number;
    likes: number;
    totalChapters: number;
    contentType: 'novel' | 'comic';
    source: 'user' | 'gutenberg' | 'internet_archive';
    externalUrl?: string;
    fileUrl?: string;
    archiveId?: string;
    format?: string;
    translationGroupId?: string;
}

interface ReviewData {
    _id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    content?: string;
    isOwn: boolean;
    createdAt: string;
}

interface CommentData {
    _id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    likes: number;
    isLiked: boolean;
    createdAt: string;
    replies: CommentData[];
}

// ─── Helper: Star Rating Display ────────────────────────────────

function StarRating({ rating, size = 'text-sm' }: { rating: number; size?: string }) {
    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`material-icons-outlined ${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                    star
                </span>
            ))}
        </div>
    );
}

// ─── Helper: Star Picker ────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className="cursor-pointer focus:outline-none"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                >
                    <span
                        className={`material-icons-outlined text-2xl transition-colors ${star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                    >
                        star
                    </span>
                </button>
            ))}
        </div>
    );
}

// ─── Helper: User Avatar ────────────────────────────────────────

function UserAvatar({ name, url }: { name?: string; url?: string }) {
    if (url) {
        const src = url.startsWith('http')
            ? url
            : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '')}${url}`;

        return <img src={src} alt={name || 'User'} className="w-10 h-10 rounded-full object-cover" />;
    }
    const initials = (name || 'User')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    return (
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
            {initials}
        </div>
    );
}

// ─── Helper: Time Ago ───────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

// ─── Main Component ─────────────────────────────────────────────

export default function BookDetailPage() {
    const { bookId } = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    // Book data
    const [book, setBook] = useState<BookData | null>(null);
    const [relatedBooks, setRelatedBooks] = useState<BookData[]>([]); // Translations
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Like state
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);

    // Library state
    const [inLibrary, setInLibrary] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);

    // Report Modal
    const [reportModalOpen, setReportModalOpen] = useState(false);

    // Rating summary
    const [avgRating, setAvgRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);

    // Reviews
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewContent, setReviewContent] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // Comments
    const [comments, setComments] = useState<CommentData[]>([]);
    const [commentText, setCommentText] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    // ─── Data Fetching ──────────────────────────────────────────

    const fetchReviews = useCallback(async () => {
        if (!bookId) return;
        try {
            const [reviewsRes, ratingRes] = await Promise.all([
                reviewsApi.getByBook(bookId),
                reviewsApi.getRating(bookId),
            ]);
            setReviews(reviewsRes.data.reviews);
            setAvgRating(ratingRes.data.average);
            setReviewCount(ratingRes.data.count);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        }
    }, [bookId]);

    const fetchComments = useCallback(async () => {
        if (!bookId) return;
        try {
            const res = await commentsApi.getByBook(bookId);
            setComments(res.data.comments);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        }
    }, [bookId]);

    const checkLikeStatus = useCallback(async () => {
        if (!bookId || !isAuthenticated) return;
        try {
            const res = await likesApi.check('book', [bookId]);
            setIsLiked(res.data.likedIds.includes(bookId));
        } catch (err) {
            console.error('Failed to check like:', err);
        }
    }, [bookId, isAuthenticated]);

    const checkLibraryStatus = useCallback(async () => {
        if (!bookId || !isAuthenticated) return;
        try {
            const res = await libraryApi.check(bookId);
            setInLibrary(res.data.inLibrary);
        } catch (err) {
            console.error('Failed to check library:', err);
        }
    }, [bookId, isAuthenticated]);

    const fetchRelatedBooks = useCallback(async (groupId: string) => {
        try {
            const res = await booksApi.getAll({ translationGroupId: groupId });
            // Filter out current book and only keep one per language (just in case)
            const others = res.data.books.filter((b: BookData) => b._id !== bookId);
            setRelatedBooks(others);
        } catch (err) {
            console.error('Failed to fetch related books:', err);
        }
    }, [bookId]);



    useEffect(() => {
        if (!bookId) return;

        const fetchAll = async () => {
            try {
                setLoading(true);
                const response = await booksApi.getById(bookId);
                setBook(response.data);
                if (response.data.translationGroupId) {
                    fetchRelatedBooks(response.data.translationGroupId);
                } else {
                    setRelatedBooks([]);
                }
                setLikeCount(response.data.likes || 0);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch book:', err);
                setError('Failed to load book details');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        fetchReviews();
        fetchComments();
        checkLikeStatus();
        checkLibraryStatus();
    }, [bookId, fetchReviews, fetchComments, checkLikeStatus, checkLibraryStatus, fetchRelatedBooks]);

    // ─── Actions ────────────────────────────────────────────────

    const handleToggleLike = async () => {
        if (!bookId || !isAuthenticated || likeLoading) return;
        setLikeLoading(true);
        try {
            const res = await likesApi.toggle('book', bookId);
            setIsLiked(res.data.liked);
            setLikeCount(res.data.count);
        } catch (err) {
            console.error('Failed to toggle like:', err);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleAddToLibrary = async () => {
        if (!bookId || !isAuthenticated || libraryLoading || inLibrary) return;
        setLibraryLoading(true);
        try {
            await libraryApi.add(bookId, { status: 'want_to_read' });
            setInLibrary(true);
        } catch (err) {
            console.error('Failed to add to library:', err);
        } finally {
            setLibraryLoading(false);
        }
    };
    const handleDownload = () => {
        if (!book?.fileUrl) return;
        window.open(book.fileUrl, '_blank');
    };

    const handleShare = async () => {
        if (!book) return;
        const shareData = {
            title: book.title,
            text: `Check out "${book.title}" on KODA!`,
            url: window.location.href,
        };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                // toast.success('Link copied to clipboard!'); // Assuming a toast library exists or just console for now
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };


    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookId || !reviewRating || reviewSubmitting) return;
        setReviewSubmitting(true);
        try {
            await reviewsApi.create(bookId, {
                rating: reviewRating,
                content: reviewContent || undefined,
            });
            setReviewRating(0);
            setReviewContent('');
            await fetchReviews();
        } catch (err) {
            console.error('Failed to submit review:', err);
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        try {
            await reviewsApi.delete(reviewId);
            await fetchReviews();
        } catch (err) {
            console.error('Failed to delete review:', err);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookId || !commentText.trim() || commentSubmitting) return;
        setCommentSubmitting(true);
        try {
            await commentsApi.create(bookId, { content: commentText.trim() });
            setCommentText('');
            await fetchComments();
        } catch (err) {
            console.error('Failed to submit comment:', err);
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!bookId || !replyText.trim()) return;
        try {
            await commentsApi.create(bookId, {
                content: replyText.trim(),
                parentId: parentId,
            });
            setReplyingTo(null);
            setReplyText('');
            await fetchComments();
        } catch (err) {
            console.error('Failed to submit reply:', err);
        }
    };

    const handleToggleCommentLike = async (commentId: string) => {
        if (!isAuthenticated) return;
        try {
            await likesApi.toggle('comment', commentId);
            await fetchComments();
        } catch (err) {
            console.error('Failed to toggle comment like:', err);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await commentsApi.delete(commentId);
            await fetchComments();
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    // ─── Loading / Error States ─────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-red-600 mb-4">{error || 'Book not found'}</p>
                    <Link to="/" className="text-primary hover:underline">Return to Home</Link>
                </div>
            </div>
        );
    }

    // ─── Render ─────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background-light">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <nav className="text-sm text-text-muted-light">
                    <Link to="/" className="hover:text-primary">Home</Link>
                    <span className="mx-2">›</span>
                    <span>{book.genres[0] || 'General'}</span>
                    <span className="mx-2">›</span>
                    <span className="text-text-main-light">{book.title}</span>
                </nav>
            </div>

            {/* Book Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Cover Image */}
                    <div className="w-full lg:w-1/3 flex justify-center">
                        <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-64 lg:w-full max-w-sm rounded-lg shadow-book"
                        />
                    </div>

                    {/* Book Info */}
                    <div className="flex-1">
                        {/* Genre Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {book.genres.map((genre) => (
                                <span
                                    key={genre}
                                    className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>

                        <h1 className="font-display text-4xl lg:text-5xl font-bold text-text-main-light mb-2">
                            {book.title}
                        </h1>
                        <p className="text-lg text-text-muted-light mb-4">
                            by <Link to="#" className="text-primary hover:underline">{book.authorName}</Link>
                        </p>

                        {/* Rating + Stats */}
                        <div className="flex items-center gap-4 mb-2">
                            {reviewCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <StarRating rating={Math.round(avgRating)} />
                                    <span className="text-text-main-light font-bold">{avgRating}</span>
                                    <span className="text-text-muted-light text-sm">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-text-muted-light">
                                {book.totalChapters} {book.contentType === 'comic' ? 'Pages' : 'Chapters'}
                            </span>
                            <span className="text-text-muted-light">{book.views} Views</span>
                            <span className="text-text-muted-light capitalize">{book.language}</span>
                            {book.source === 'gutenberg' && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    Project Gutenberg
                                </span>
                            )}
                            {book.source === 'internet_archive' && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    Internet Archive
                                </span>
                            )}
                        </div>

                        {/* Language Selector (Linked Translations) */}
                        {relatedBooks.length > 0 && (
                            <div className="mb-6 flex items-center gap-3">
                                <span className="text-sm font-medium text-text-muted-light">Available in:</span>
                                <div className="flex flex-wrap gap-2">
                                    {/* Current Language - Active State */}
                                    <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full border border-primary cursor-default">
                                        {SUPPORTED_LANGUAGES.find(l => l.code === book.language)?.name || book.language.toUpperCase()}
                                    </span>

                                    {/* Other Languages */}
                                    {relatedBooks.map((rb) => (
                                        <button
                                            key={rb._id}
                                            onClick={() => navigate(`/book/${rb._id}`)}
                                            className="px-3 py-1 bg-white hover:bg-gray-50 text-text-muted-light text-xs font-medium rounded-full border border-gray-200 transition-colors cursor-pointer"
                                        >
                                            {SUPPORTED_LANGUAGES.find(l => l.code === rb.language)?.name || rb.language.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            <Link
                                to={book.contentType === 'comic' ? `/comic/${bookId}` : `/read/${bookId}`}
                                className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all shadow-md flex items-center gap-2 cursor-pointer"
                            >
                                <span className="material-icons-outlined text-sm">{book.contentType === 'comic' ? 'collections' : 'menu_book'}</span>
                                {book.contentType === 'comic' ? 'Read Comic' : 'Read Now'}
                            </Link>
                            {book.fileUrl && (
                                <button
                                    onClick={handleDownload}
                                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <span className="material-icons-outlined text-sm">download</span>
                                    Download {book.format ? book.format.toUpperCase() : 'Book'}
                                </button>
                            )}
                            {/* Like Button */}
                            <button
                                onClick={handleToggleLike}
                                disabled={!isAuthenticated || likeLoading}
                                className={`p-3 border rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${isLiked
                                    ? 'border-red-300 bg-red-50 text-red-500'
                                    : 'border-gray-300 hover:border-primary hover:text-primary'
                                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={isAuthenticated ? (isLiked ? 'Unlike' : 'Like') : 'Log in to like'}
                            >
                                <span className="material-icons-outlined">
                                    {isLiked ? 'favorite' : 'favorite_border'}
                                </span>
                                {likeCount > 0 && <span className="text-sm font-medium">{likeCount}</span>}
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-3 border border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors cursor-pointer"
                                title="Share"
                            >
                                <span className="material-icons-outlined">share</span>
                            </button>

                            {/* Add to Library */}
                            <button
                                onClick={handleAddToLibrary}
                                disabled={!isAuthenticated || libraryLoading || inLibrary}
                                className={`px-4 py-3 border rounded-lg font-medium transition-colors flex items-center gap-2 ${inLibrary
                                    ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                                    : 'border-gray-300 hover:border-primary hover:text-primary'
                                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={inLibrary ? 'In Library' : 'Add to Library'}
                            >
                                {inLibrary ? <Check className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                                {inLibrary ? 'Saved' : 'Library'}
                            </button>

                            {/* Report Button */}
                            <button
                                onClick={() => setReportModalOpen(true)}
                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                                title="Report content"
                            >
                                <AlertCircle className="w-5 h-5" />
                            </button>


                        </div>

                        {/* Synopsis */}
                        <div className="prose max-w-none">
                            <h3 className="font-display text-xl font-bold mb-3">Description</h3>
                            <p className="text-text-muted-light leading-relaxed whitespace-pre-line">
                                {book.description || 'No description available.'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* About the Author */}
                        <div>
                            <h3 className="font-display text-2xl font-bold mb-4">About the Author</h3>
                            <p className="text-text-muted-light leading-relaxed">{book.authorName}</p>
                        </div>

                        {/* ─── REVIEWS SECTION ─────────────────────────── */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-display text-2xl font-bold">
                                    Reviews
                                    {reviewCount > 0 && (
                                        <span className="text-text-muted-light text-lg font-normal ml-2">
                                            ({reviewCount})
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {/* Review Form */}
                            {isAuthenticated ? (
                                <form onSubmit={handleSubmitReview} className="mb-8 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <UserAvatar name={user!.displayName} url={user!.avatarUrl} />
                                        <div>
                                            <p className="font-medium text-sm">{user!.displayName}</p>
                                            <p className="text-xs text-text-muted-light">Write a review</p>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-sm text-text-muted-light mb-1 block">Your rating</label>
                                        <StarPicker value={reviewRating} onChange={setReviewRating} />
                                    </div>
                                    <textarea
                                        value={reviewContent}
                                        onChange={(e) => setReviewContent(e.target.value)}
                                        placeholder="Share your thoughts about this book... (optional)"
                                        className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none text-sm"
                                        rows={3}
                                        maxLength={2000}
                                    />
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-xs text-text-muted-light">{reviewContent.length}/2000</span>
                                        <button
                                            type="submit"
                                            disabled={!reviewRating || reviewSubmitting}
                                            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {reviewSubmitting ? 'Posting...' : 'Post Review'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200 text-center">
                                    <span className="material-icons-outlined text-3xl text-gray-400 mb-2 block">rate_review</span>
                                    <p className="text-text-muted-light mb-3">Log in to write a review</p>
                                    <Link to="/login" className="text-primary hover:underline text-sm font-medium">Sign in →</Link>
                                </div>
                            )}

                            {/* Reviews List */}
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <UserAvatar name={review.userName} url={review.userAvatar} />
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{review.userName}</p>
                                                    <p className="text-xs text-text-muted-light">{timeAgo(review.createdAt)}</p>
                                                </div>
                                                <StarRating rating={review.rating} />
                                                {review.isOwn && (
                                                    <button
                                                        onClick={() => handleDeleteReview(review._id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                                        title="Delete your review"
                                                    >
                                                        <span className="material-icons-outlined text-sm">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                            {review.content && (
                                                <p className="text-text-muted-light text-sm leading-relaxed">{review.content}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-muted-light text-sm text-center py-6">No reviews yet. Be the first to review!</p>
                            )}
                        </div>

                        {/* ─── COMMENTS / DISCUSSION SECTION ──────────── */}
                        <div>
                            <h3 className="font-display text-2xl font-bold mb-6">
                                Discussion
                                {comments.length > 0 && (
                                    <span className="text-text-muted-light text-lg font-normal ml-2">
                                        ({comments.length})
                                    </span>
                                )}
                            </h3>

                            {/* Comment Form */}
                            {isAuthenticated ? (
                                <form onSubmit={handleSubmitComment} className="mb-8">
                                    <div className="flex gap-3">
                                        <UserAvatar name={user!.displayName} url={user!.avatarUrl} />
                                        <div className="flex-1">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Join the discussion..."
                                                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none text-sm"
                                                rows={2}
                                                maxLength={1000}
                                            />
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    type="submit"
                                                    disabled={!commentText.trim() || commentSubmitting}
                                                    className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    {commentSubmitting ? 'Posting...' : 'Comment'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200 text-center">
                                    <span className="material-icons-outlined text-3xl text-gray-400 mb-2 block">chat_bubble_outline</span>
                                    <p className="text-text-muted-light mb-3">Log in to join the discussion</p>
                                    <Link to="/login" className="text-primary hover:underline text-sm font-medium">Sign in →</Link>
                                </div>
                            )}

                            {/* Comments List */}
                            {comments.length > 0 ? (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment._id} className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <UserAvatar name={comment.userName} url={comment.userAvatar} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm">{comment.userName}</span>
                                                        <span className="text-xs text-text-muted-light">{timeAgo(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-text-main-light mb-3 break-words">{comment.content}</p>

                                                    {/* Comment Actions */}
                                                    <div className="flex items-center gap-4 text-xs text-text-muted-light">
                                                        <button
                                                            onClick={() => handleToggleCommentLike(comment._id)}
                                                            className={`flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer ${comment.isLiked ? 'text-red-500' : ''
                                                                }`}
                                                        >
                                                            <span className="material-icons-outlined text-sm">
                                                                {comment.isLiked ? 'favorite' : 'favorite_border'}
                                                            </span>
                                                            {comment.likes > 0 && comment.likes}
                                                        </button>
                                                        {isAuthenticated && (
                                                            <button
                                                                onClick={() => {
                                                                    setReplyingTo(replyingTo === comment._id ? null : comment._id);
                                                                    setReplyText('');
                                                                }}
                                                                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                <span className="material-icons-outlined text-sm">reply</span>
                                                                Reply
                                                            </button>
                                                        )}
                                                        {isAuthenticated && comment.userId === user?.id && (
                                                            <button
                                                                onClick={() => handleDeleteComment(comment._id)}
                                                                className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"
                                                            >
                                                                <span className="material-icons-outlined text-sm">delete</span>
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Reply Input */}
                                                    {replyingTo === comment._id && (
                                                        <div className="mt-3 flex gap-2">
                                                            <input
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder={`Reply to ${comment.userName}...`}
                                                                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm"
                                                                maxLength={1000}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleSubmitReply(comment._id);
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => handleSubmitReply(comment._id)}
                                                                disabled={!replyText.trim()}
                                                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
                                                            >
                                                                Reply
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Replies */}
                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-100 space-y-3">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply._id} className="flex items-start gap-2">
                                                                    <UserAvatar name={reply.userName} url={reply.userAvatar} />
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <span className="font-medium text-xs">{reply.userName}</span>
                                                                            <span className="text-xs text-text-muted-light">{timeAgo(reply.createdAt)}</span>
                                                                        </div>
                                                                        <p className="text-sm text-text-main-light">{reply.content}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-muted-light text-sm text-center py-6">No comments yet. Start the conversation!</p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Book Info */}
                        <div className="p-6 bg-white rounded-lg border border-gray-100">
                            <h4 className="font-display text-lg font-bold mb-4">Book Info</h4>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-text-muted-light">Language</dt>
                                    <dd className="capitalize">{book.language}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-text-muted-light">{book.contentType === 'comic' ? 'Pages' : 'Chapters'}</dt>
                                    <dd>{book.totalChapters}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-text-muted-light">Source</dt>
                                    <dd className="capitalize">{book.source === 'gutenberg' ? 'Project Gutenberg' : book.source === 'internet_archive' ? 'Internet Archive' : book.source}</dd>
                                </div>
                                {avgRating > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-text-muted-light">Rating</dt>
                                        <dd className="flex items-center gap-1">
                                            <span className="material-icons-outlined text-yellow-400 text-sm">star</span>
                                            {avgRating} / 5
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <dt className="text-text-muted-light">Likes</dt>
                                    <dd>{likeCount}</dd>
                                </div>
                                {book.externalUrl && (
                                    <div className="flex justify-between">
                                        <dt className="text-text-muted-light">External Link</dt>
                                        <dd><a href={book.externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Source</a></dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </section>

            {/* Report Modal */}
            <ReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                targetId={bookId || ''}
                targetType="book"
                targetName={book.title}
            />
        </div>
    );
}

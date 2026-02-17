import { Library, BookOpenText } from "lucide-react";
import { useAuthStore } from "../../features/auth/authStore";
import { useNavigate } from "react-router-dom";

type BookSource = 'user' | 'gutenberg' | 'internet_archive';

interface BookCardProps {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    genre: string;
    badge?: string;
    reads?: string;
    source?: BookSource;
    externalUrl?: string;
    contentType?: 'novel' | 'comic';
}

function getSourceBadge(source?: BookSource) {
    if (!source || source === 'user') return null;
    if (source === 'gutenberg') {
        return {
            label: 'Gutenberg',
            icon: BookOpenText,
            className: 'bg-emerald-600/90 text-white',
        };
    }
    if (source === 'internet_archive') {
        return {
            label: 'Archive.org',
            icon: Library,
            className: 'bg-blue-600/90 text-white',
        };
    }
    return null;
}

export default function BookCard({
    id,
    title,
    author,
    coverUrl,
    genre,
    badge,
    reads,
    source,
    contentType,
}: BookCardProps) {
    const sourceBadge = getSourceBadge(source);
    const { isAuthenticated, openAuthModal } = useAuthStore();
    const navigate = useNavigate();

    const handleRead = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            openAuthModal('signup');
            return;
        }
        navigate(`/book/${id}`);
    };

    return (
        <div className="break-inside-avoid relative group cursor-pointer h-full flex flex-col" onClick={handleRead}>
            <div className="relative overflow-hidden rounded-xl shadow-md aspect-[2/3] w-full bg-gray-200">
                <img
                    alt={`${title} Cover`}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    src={coverUrl || `https://via.placeholder.com/300x450/6366f1/ffffff?text=${encodeURIComponent(title.charAt(0))}`}
                    loading="lazy"
                />
                {/* Regular badge (NEW, etc.) */}
                {badge && (
                    <div className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-1 rounded ${badge === 'NEW' ? 'bg-primary/90' : 'bg-black/70 backdrop-blur-sm'
                        }`}>
                        {badge}
                    </div>
                )}
                {/* Source badge */}
                {sourceBadge && (
                    <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm ${sourceBadge.className}`}>
                        <sourceBadge.icon className="h-3 w-3" />
                        {sourceBadge.label}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                        onClick={handleRead}
                        className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                        {contentType === 'comic' ? 'View Comic' : 'Read Now'}
                    </button>
                </div>
            </div>
            <div className="mt-3 flex-1">
                <h3 className="font-display text-lg font-bold leading-tight line-clamp-2">{title}</h3>
                <p className="text-sm text-text-muted-light line-clamp-1">
                    {genre} {reads && `• ${reads}`}
                </p>
                {author && (
                    <p className="text-sm text-text-muted-light line-clamp-1">
                        by {author}
                    </p>
                )}
            </div>
        </div>
    );
}

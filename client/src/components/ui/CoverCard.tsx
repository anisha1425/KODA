import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";

interface CoverCardStory {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    coverGradient: [string, string];
    isPremium?: boolean;
}

interface CoverCardProps {
    story: CoverCardStory;
}

export default function CoverCard({ story }: CoverCardProps) {
    const navigate = useNavigate();
    const { isAuthenticated, openAuthModal } = useAuthStore();

    const handleClick = () => {
        if (!isAuthenticated) {
            openAuthModal('signup');
            return;
        }
        navigate(`/book/${story.id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="group block flex-shrink-0 cursor-pointer"
        >
            <div
                className="relative w-[140px] sm:w-[160px] md:w-[180px] aspect-[2/3] overflow-hidden rounded-xl transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl bg-gray-200"
            >
                {/* Cover Image or Gradient Fallback */}
                {story.coverUrl ? (
                    <img
                        src={story.coverUrl}
                        alt={story.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(135deg, ${story.coverGradient[0]}, ${story.coverGradient[1]})`,
                        }}
                    />
                )}

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Title & Author Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3">
                    <h3 className="font-display text-sm font-semibold text-white line-clamp-2 drop-shadow-lg">
                        {story.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/80 line-clamp-1 drop-shadow-md">
                        {story.author}
                    </p>
                </div>

                {/* Premium Badge */}
                {story.isPremium && (
                    <div className="absolute top-2 right-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md">
                        Premium
                    </div>
                )}
            </div>
        </div>
    );
}

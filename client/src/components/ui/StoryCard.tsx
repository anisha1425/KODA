import { Star, Eye, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Story } from "@/data/mockData";
import { formatViews } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "../../features/auth/authStore";

interface StoryCardProps {
    story: Story;
    variant?: "default" | "compact";
}

export default function StoryCard({ story, variant = "default" }: StoryCardProps) {
    const isCompact = variant === "compact";
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
            className="group block rounded-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
            <div className="overflow-hidden rounded-lg bg-card-light shadow-sm border border-border-light transition-shadow duration-300 group-hover:shadow-md">
                {/* Cover */}
                <div
                    className={`relative flex items-end justify-center overflow-hidden ${isCompact ? "h-44" : "h-56"}`}
                    style={{
                        background: `linear-gradient(135deg, ${story.coverGradient[0]}, ${story.coverGradient[1]})`,
                    }}
                >
                    {/* Book title overlay */}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative p-4 text-center">
                        <BookOpen className="mx-auto mb-1 h-8 w-8 text-white/80" />
                        <p className="font-display text-sm font-semibold text-white/90 line-clamp-2">
                            {story.title}
                        </p>
                    </div>

                    {/* Language badge */}
                    <Badge
                        variant="secondary"
                        className="absolute top-2 left-2 bg-white/80 text-text-main-light text-xs backdrop-blur-sm"
                    >
                        {story.language === "English" ? "EN" : story.language === "German" ? "DE" : "ES"}
                    </Badge>

                    {/* Premium badge */}
                    {story.isPremium && (
                        <Badge className="absolute top-2 right-2 bg-primary text-white text-xs">
                            Premium
                        </Badge>
                    )}
                </div>

                {/* Info */}
                <div className="p-3">
                    <h3 className="font-display text-sm font-semibold text-text-main-light line-clamp-1 group-hover:text-primary transition-colors">
                        {story.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted-light">{story.author}</p>

                    {!isCompact && (
                        <p className="mt-1.5 text-xs text-text-muted-light line-clamp-2">
                            {story.synopsis}
                        </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs border-border-light text-text-muted-light">
                            {story.genre}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-text-muted-light">
                            <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                {story.rating}
                            </span>
                            <span className="flex items-center gap-0.5">
                                <Eye className="h-3 w-3" />
                                {formatViews(story.views)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

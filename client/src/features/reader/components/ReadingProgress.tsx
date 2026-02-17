interface ReadingProgressProps {
    chapterNumber: number;
    progressPercent: number;
    onBookmark: () => void;
    onComment: () => void;
    commentCount: number;
}

export default function ReadingProgress({
    chapterNumber,
    progressPercent,
    onBookmark,
    onComment,
    commentCount,
}: ReadingProgressProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 transition-colors duration-300">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
                {/* Bookmark Button */}
                <button
                    onClick={onBookmark}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors cursor-pointer"
                >
                    <span className="material-icons-outlined">bookmark_add</span>
                    <span className="hidden sm:inline text-sm font-medium">Bookmark this page</span>
                </button>

                {/* Progress Bar */}
                <div className="flex-grow mx-6 max-w-md hidden md:flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        <span>Chapter {chapterNumber}</span>
                        <span>{progressPercent}% Complete</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Comment Button */}
                <button
                    onClick={onComment}
                    className="flex items-center gap-2 bg-background-light hover:bg-gray-200 px-4 py-2 rounded-full transition-colors text-text-main-light cursor-pointer"
                >
                    <span className="material-icons-outlined text-sm">chat_bubble_outline</span>
                    <span className="text-sm font-medium">Leave a Comment</span>
                    {commentCount > 0 && (
                        <span className="ml-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {commentCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}

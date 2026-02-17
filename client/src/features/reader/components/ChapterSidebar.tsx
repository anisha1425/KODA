interface Chapter {
    id: string;
    title: string;
}

interface Bookmark {
    chapterId: string;
    page: number;
    excerpt: string;
}

interface ChapterSidebarProps {
    chapters: Chapter[];
    currentChapterId: string;
    bookmarks: Bookmark[];
    onChapterSelect: (chapterId: string) => void;
}

export default function ChapterSidebar({
    chapters,
    currentChapterId,
    bookmarks,
    onChapterSelect,
}: ChapterSidebarProps) {
    return (
        <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-surface-light/50">
            <div className="p-6">
                <h3 className="font-display text-lg font-bold mb-6 text-text-main-light border-b-2 border-primary pb-2">
                    Table of Contents
                </h3>

                <nav className="space-y-1">
                    {chapters.map((chapter, index) => {
                        // Compare using the chapter ID directly
                        const isActive = currentChapterId === chapter.id;
                        const chapterNum = index + 1;

                        return (
                            <button
                                key={chapter.id}
                                onClick={() => onChapterSelect(chapter.id)}
                                className={`
                                    flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-lg
                                    text-sm transition-all cursor-pointer
                                    ${isActive
                                        ? 'text-primary bg-primary/10 font-semibold border-l-4 border-primary'
                                        : 'text-gray-600 hover:text-text-main-light hover:bg-gray-100'
                                    }
                                `}
                            >
                                <span
                                    className={`
                                        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                                        text-xs font-bold
                                        ${isActive
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }
                                    `}
                                >
                                    {chapterNum}
                                </span>
                                <span className="line-clamp-2 leading-snug flex-1 min-w-0">
                                    {chapter.title}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Bookmarks Section */}
                {bookmarks.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Bookmarks
                        </h4>
                        <div className="space-y-3">
                            {bookmarks.map((bookmark, index) => (
                                <button
                                    key={index}
                                    onClick={() => onChapterSelect(bookmark.chapterId)}
                                    className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-all border border-transparent hover:border-gray-100 cursor-pointer w-full text-left"
                                >
                                    <span className="material-icons-outlined text-primary text-sm mt-0.5">
                                        bookmark
                                    </span>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">
                                            Chapter {bookmark.chapterId} • Page {bookmark.page}
                                        </p>
                                        <p className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors line-clamp-2">
                                            "{bookmark.excerpt}"
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}


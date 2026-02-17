import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface ChapterContentProps {
    chapterNumber: number;
    chapterTitle: string;
    content: string;
    fontSize: number;
    fontFamily: string;
    onPageCountChange: (count: number) => void;
    currentPage: number;
    isPagedMode: boolean;
    prevChapter?: { id: string; title: string };
    nextChapter?: { id: string; title: string };
    onNavigate: (chapterId: string) => void;
}

export interface ChapterContentHandle {
    calculatePages: () => void;
}

const ChapterContent = forwardRef<ChapterContentHandle, ChapterContentProps>(({
    chapterNumber,
    chapterTitle,
    content,
    fontSize,
    fontFamily,
    onPageCountChange,
    currentPage,
    isPagedMode,
    prevChapter,
    nextChapter,
    onNavigate,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLElement>(null);
    const [columnCount, setColumnCount] = useState(1);

    // Dynamic font size for inline styles
    const fontSizeMap: Record<number, string> = {
        12: '16px', // User default
        14: '18px',
        16: '20px',
        18: '22px',
        20: '24px',
        22: '26px',
    };

    const gap = 80; // Fixed column gap

    const calculatePages = () => {
        if (!containerRef.current || !isPagedMode) return;

        const containerWidth = containerRef.current.clientWidth;
        const scrollWidth = containerRef.current.scrollWidth;

        // Accurate page count including gap
        // Formula: (ScrollWidth + Gap) / (ContainerWidth + Gap)
        const totalPages = Math.max(1, Math.ceil((scrollWidth + gap) / (containerWidth + gap)));

        onPageCountChange(totalPages);

        // Determine columns
        if (window.innerWidth >= 1024) {
            setColumnCount(2);
        } else {
            setColumnCount(1);
        }
    };

    useImperativeHandle(ref, () => ({
        calculatePages
    }));

    // Recalculate pages on resize, content change, or font size change
    useEffect(() => {
        const timer = setTimeout(() => {
            calculatePages();
        }, 100);

        const handleResize = () => calculatePages();
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, fontSize, fontFamily, isPagedMode]);

    // Handle smooth transition with GAP AWARE STRIDE
    // Stride = 100% + Gap
    // We use calc() to combine percentage and pixel values
    const translateXStyle = isPagedMode
        ? `calc(-1 * (${currentPage - 1}) * (100% + ${gap}px))`
        : 'none';

    // CSS Injection for internal padding (Mac Book style margins)
    const paddingVal = window.innerWidth >= 1024 ? 60 : 30;
    const internalStyles = `
        .novel-prose p, .novel-prose h1, .novel-prose h2, .novel-prose h3, .novel-prose ul, .novel-prose ol, .novel-prose blockquote, .chapter-header, .chapter-nav {
            padding-left: ${paddingVal}px;
            padding-right: ${paddingVal}px;
            box-sizing: border-box;
        }
        .novel-prose img {
            max-width: calc(100% - ${paddingVal * 2}px);
            margin: 0 auto;
            display: block;
        }
    `;

    return (
        <div
            className="flex-grow h-full overflow-hidden relative"
            style={{ backgroundColor: 'inherit' }}
        >
            <style>{internalStyles}</style>

            <div
                ref={containerRef}
                className="h-full w-full transition-transform duration-300 ease-out will-change-transform"
                style={{
                    transform: isPagedMode ? `translateX(${translateXStyle})` : 'none',
                    display: isPagedMode ? 'block' : 'flex',
                    flexDirection: 'column',
                    overflow: 'visible', // Visible allows columns to exist to the right
                }}
            >
                {/* 
                    Column Container 
                    - Zero container margin/padding to allow perfect translation
                    - Uses standard column-gap (80px)
                */}
                <article
                    ref={contentRef}
                    className={`novel-content h-full text-gray-800 antialiased`}
                    style={{
                        columnCount: columnCount,
                        columnGap: `${gap}px`,
                        columnFill: 'auto',
                        width: '100%',
                        height: '100%',
                        fontSize: fontSizeMap[fontSize] || '16px',
                        lineHeight: '1.7',
                        textAlign: 'justify',
                        padding: 0, // No padding on container!
                        boxSizing: 'border-box',
                        fontFamily: fontFamily === 'serif' ? '"Charter", "Bitstream Charter", "Sitka Text", Cambria, serif' : 'system-ui, sans-serif'
                    }}
                >
                    {/* Chapter Header */}
                    <div className="mb-12 text-center pt-20 break-inside-avoid chapter-header">
                        <span className="text-primary/80 font-bold tracking-[0.15em] text-xs uppercase mb-3 block">
                            Chapter {chapterNumber}
                        </span>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-gray-900 mb-8">
                            {chapterTitle}
                        </h1>
                        <div className="w-12 h-1 bg-gray-200 mx-auto rounded-full"></div>
                    </div>

                    <div
                        dangerouslySetInnerHTML={{ __html: content }}
                        className="novel-prose [&>p]:mb-6 [&>p]:indent-4"
                    />

                    {/* Chapter Navigation */}
                    <div className="mt-16 pt-16 pb-32 break-inside-avoid w-full chapter-nav">
                        <div className="border-t border-gray-100 pt-12">
                            <nav className="flex items-center justify-between">
                                {prevChapter ? (
                                    <button
                                        onClick={() => onNavigate(prevChapter.id)}
                                        className="text-left group cursor-pointer max-w-[45%]"
                                    >
                                        <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Previous</span>
                                        <span className="font-serif text-base font-medium text-gray-700 group-hover:text-primary transition-colors truncate block">
                                            {prevChapter.title}
                                        </span>
                                    </button>
                                ) : <div></div>}

                                {nextChapter ? (
                                    <button
                                        onClick={() => onNavigate(nextChapter.id)}
                                        className="text-right group cursor-pointer max-w-[45%]"
                                    >
                                        <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Next</span>
                                        <span className="font-serif text-base font-medium text-gray-700 group-hover:text-primary transition-colors truncate block">
                                            {nextChapter.title}
                                        </span>
                                    </button>
                                ) : (
                                    <div className="text-right">
                                        <span className="text-xs uppercase tracking-widest text-gray-400 mb-1 block">End of Book</span>
                                    </div>
                                )}
                            </nav>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
});

ChapterContent.displayName = 'ChapterContent';

export default ChapterContent; // End

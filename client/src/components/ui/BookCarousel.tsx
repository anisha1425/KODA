import { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface BookCarouselProps {
    children: React.ReactNode;
}

export default function BookCarousel({ children }: BookCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = 400; // ~2-3 covers
        scrollRef.current.scrollBy({
            left: direction === "right" ? scrollAmount : -scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative group/carousel">
            {/* Left Arrow */}
            <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 opacity-0 group-hover/carousel:opacity-100"
                aria-label="Scroll left"
            >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
            >
                {children}
            </div>

            {/* Right Arrow */}
            <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                aria-label="Scroll right"
            >
                <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { genresApi } from "@/lib/api";
import { useAuthStore } from "../../features/auth/authStore";

interface Genre {
    _id: string;
    slug: string;
    name: string;
    icon: string;
    bookCount: number;
    color: [string, string];
}

// Fallback genres for when the API hasn't been seeded yet
const FALLBACK_GENRES: Genre[] = [
    { _id: '0', slug: 'all', name: 'All Genres', icon: '📚', bookCount: 0, color: ['#6366f1', '#818cf8'] },
    { _id: '1', slug: 'fantasy', name: 'Fantasy', icon: '✨', bookCount: 0, color: ['#7C3AED', '#A78BFA'] },
    { _id: '2', slug: 'romance', name: 'Romance', icon: '💕', bookCount: 0, color: ['#EC4899', '#F9A8D4'] },
    { _id: '3', slug: 'sci-fi', name: 'Sci-Fi', icon: '🚀', bookCount: 0, color: ['#0EA5E9', '#7DD3FC'] },
    { _id: '4', slug: 'horror', name: 'Horror', icon: '👻', bookCount: 0, color: ['#1F2937', '#6B7280'] },
    { _id: '5', slug: 'comedy', name: 'Comedy', icon: '😄', bookCount: 0, color: ['#F59E0B', '#FCD34D'] },
    { _id: '6', slug: 'drama', name: 'Drama', icon: '🎭', bookCount: 0, color: ['#DC2626', '#FCA5A5'] },
    { _id: '7', slug: 'mystery', name: 'Mystery', icon: '🔍', bookCount: 0, color: ['#4338CA', '#818CF8'] },
    { _id: '8', slug: 'adventure', name: 'Adventure', icon: '🧭', bookCount: 0, color: ['#059669', '#6EE7B7'] },
    { _id: '9', slug: 'historical', name: 'Historical', icon: '🏛️', bookCount: 0, color: ['#92400E', '#D97706'] },
    { _id: '10', slug: 'poetry', name: 'Poetry', icon: '🪶', bookCount: 0, color: ['#9333EA', '#C084FC'] },
    { _id: '11', slug: 'thriller', name: 'Thriller', icon: '⚡', bookCount: 0, color: ['#B91C1C', '#F87171'] },
    { _id: '12', slug: 'slice-of-life', name: 'Slice of Life', icon: '☕', bookCount: 0, color: ['#D97706', '#FDE68A'] },
];

export default function GenreGrid() {
    const [genres, setGenres] = useState<Genre[]>(FALLBACK_GENRES);
    const navigate = useNavigate();
    const { isAuthenticated, openAuthModal, setRedirectPath } = useAuthStore();

    useEffect(() => {
        genresApi.getAll()
            .then(res => {
                const data = res.data.genres;
                if (Array.isArray(data) && data.length > 0) {
                    // Ensure "All" is always first
                    const allGenre = FALLBACK_GENRES[0];
                    setGenres([allGenre, ...data]);
                }
            })
            .catch(err => console.error('Failed to load genres:', err));
    }, []);

    const handleGenreClick = (slug: string) => {
        const targetUrl = slug === 'all' ? '/search' : `/search?genre=${slug}`;

        if (!isAuthenticated) {
            setRedirectPath(targetUrl);
            openAuthModal('signup');
            return;
        }
        navigate(targetUrl);
    };

    return (
        <section className="py-12 md:py-16 bg-card-light/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="mb-8 flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-display text-2xl font-bold text-text-main-light md:text-3xl">
                            Browse by Genre
                        </h2>
                        <p className="text-sm text-text-muted-light">
                            Find your next favorite story
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {genres.map((genre, index) => (
                        <motion.div
                            key={genre._id || genre.slug}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <div
                                onClick={() => handleGenreClick(genre.slug)}
                                className="group flex flex-col items-center gap-2 rounded-lg border border-border-light bg-background-light p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 cursor-pointer"
                            >
                                <span className="text-3xl">{genre.icon}</span>
                                <span className="font-display text-sm font-semibold text-text-main-light group-hover:text-primary transition-colors">
                                    {genre.name}
                                </span>
                                <span className="text-xs text-text-muted-light">
                                    {genre.bookCount > 0 ? `${genre.bookCount.toLocaleString()} stories` : 'Explore'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

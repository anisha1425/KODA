import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import CoverCard from "@/components/ui/CoverCard";
import BookCarousel from "@/components/ui/BookCarousel";
import { booksApi } from "@/lib/api";

interface ApiBook {
    _id: string;
    title: string;
    authorName: string;
    coverUrl?: string;
    contentType: string;
    views: number;
    likes: number;
}

export default function TrendingStories() {
    const [books, setBooks] = useState<ApiBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        booksApi.getTrending()
            .then(res => {
                const data = res.data.books || res.data;
                setBooks(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error('Failed to load trending:', err);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <section className="py-12 md:py-16 bg-gradient-to-br from-[#FAE8D4] to-[#F5E6D3]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-text-main-light md:text-3xl">Trending now</h2>
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-[160px] aspect-[2/3] rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="py-12 bg-gradient-to-br from-[#FAE8D4] to-[#F5E6D3]">
                <div className="max-w-7xl mx-auto px-4 text-center text-text-muted-light">
                    <p>Unable to load trending stories right now.</p>
                </div>
            </section>
        );
    }

    if (books.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-gradient-to-br from-[#FAE8D4] to-[#F5E6D3]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="mb-8 flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-display text-2xl font-bold text-text-main-light md:text-3xl">
                            Trending now
                        </h2>
                        <p className="text-sm text-text-muted-light">
                            The hottest stories everyone's reading
                        </p>
                    </div>
                </motion.div>

                <BookCarousel>
                    {books.map((book, index) => (
                        <motion.div
                            key={book._id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <CoverCard
                                story={{
                                    id: book._id,
                                    title: book.title,
                                    author: book.authorName,
                                    coverUrl: book.coverUrl,
                                    coverGradient: ['#7C3AED', '#EC4899'],
                                    isPremium: false,
                                }}
                            />
                        </motion.div>
                    ))}
                </BookCarousel>
            </div>
        </section>
    );
}

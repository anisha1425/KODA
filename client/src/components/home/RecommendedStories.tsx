import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
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
    genres: string[];
}



export default function RecommendedStories() {
    const [books, setBooks] = useState<ApiBook[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchRecommended = async () => {
            try {
                const res = await booksApi.getRecommended();
                const data = res.data.books || res.data;
                setBooks(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch recommended books:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommended();
    }, []);

    if (loading) {
        return (
            <section className="py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 w-48 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-lg bg-gray-200 animate-pulse" />
                        ))}
                    </div>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <Heart className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <h2 className="font-display text-2xl font-bold text-text-main-light md:text-3xl">
                            Recommended for you
                        </h2>
                        <p className="text-sm text-text-muted-light">
                            Stories we think you'll love
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
                                    coverGradient: ['#EC4899', '#EF4444'],
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

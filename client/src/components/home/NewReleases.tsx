import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import CoverCard from "@/components/ui/CoverCard";
import BookCarousel from "@/components/ui/BookCarousel";
import { booksApi, comicsApi } from "@/lib/api";

interface ApiBook {
    _id: string;
    title: string;
    authorName: string;
    coverUrl?: string;
    contentType: string;
    views: number;
    likes: number;
    createdAt?: string;
}

export default function NewReleases() {
    const [books, setBooks] = useState<ApiBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch English books and comics
                const [booksRes, comicsRes] = await Promise.all([
                    booksApi.getAll({ page: 1, sortBy: 'recent', limit: 10, language: 'en' }),
                    comicsApi.getAll({ page: 1, language: 'en' })
                ]);

                // Normalize book data
                const booksRaw = booksRes.data.books || booksRes.data;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const booksList = Array.isArray(booksRaw) ? booksRaw.map((b: ApiBook | any) => ({
                    ...b,
                    contentType: 'novel',
                    authorName: b.author?.displayName || b.authorName || 'Unknown Author'
                })) : [];

                // Normalize comic data
                const comicsRaw = comicsRes.data.books || comicsRes.data;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const comicsList = Array.isArray(comicsRaw) ? comicsRaw.map((c: ApiBook | any) => ({
                    ...c,
                    contentType: 'comic',
                    authorName: c.author?.displayName || c.authorName || 'Unknown Author'
                })) : [];

                // Combine and sort by createdAt (most recent first)
                const combined = [...booksList, ...comicsList].sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                // Take top 10
                setBooks(combined.slice(0, 10));
            } catch (err) {
                console.error('Failed to load new releases:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <section className="py-12 md:py-16 bg-gradient-to-br from-[#FAE8D4] to-[#F5E6D3]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                            <Sparkles className="h-5 w-5 text-accent" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-text-main-light md:text-3xl">New Releases</h2>
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
                    <p>Unable to load new releases right now.</p>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-display text-2xl font-bold text-text-main-light md:text-3xl">
                            New Releases
                        </h2>
                        <p className="text-sm text-text-muted-light">
                            Fresh stories just published
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
                                    coverGradient: ['#0EA5E9', '#7C3AED'],
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

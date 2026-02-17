import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { authorApi } from '../../lib/api';

export default function HeroSection() {
    const { isAuthenticated, user, updateUser, openAuthModal } = useAuthStore();
    const navigate = useNavigate();
    const [upgrading, setUpgrading] = useState(false);

    const isAuthorOrAdmin = user?.role === 'author' || user?.role === 'admin';

    const handleBecomeAuthor = async () => {
        if (!isAuthenticated) {
            openAuthModal('signup');
            return;
        }
        try {
            setUpgrading(true);
            const res = await authorApi.becomeAuthor();
            updateUser({ role: res.data.user.role });
            navigate('/author');
        } catch (err) {
            console.error('Become author error:', err);
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <header className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-gray-200 rounded-full blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Text Content */}
                    <div className="text-center lg:text-left space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-100 mb-4">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold tracking-wide uppercase text-text-muted-light">
                                Free Reading Platform
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="font-display text-5xl lg:text-7xl font-bold leading-tight text-text-main-light">
                            Stories That <br />
                            <span className="text-primary italic font-serif">Transcend</span> Borders
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg text-text-muted-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Discover thousands of free books and comics in over 30 languages.
                            Join a global community of readers and empower the next generation of writers.
                        </p>

                        {/* CTAs — auth-aware */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => {
                                    if (isAuthenticated) {
                                        navigate('/search');
                                    } else {
                                        openAuthModal('signup');
                                    }
                                }}
                                className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Start Reading
                                <span className="material-icons-outlined text-sm">arrow_forward</span>
                            </button>

                            {isAuthorOrAdmin ? (
                                <Link
                                    to="/author"
                                    className="px-8 py-4 bg-white text-text-main-light border border-gray-200 hover:border-primary rounded-full font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span className="material-icons-outlined text-sm">edit</span>
                                    Author Studio
                                </Link>
                            ) : (
                                <button
                                    onClick={handleBecomeAuthor}
                                    disabled={upgrading}
                                    className="px-8 py-4 bg-white text-text-main-light border border-gray-200 hover:border-primary rounded-full font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <span className="material-icons-outlined text-sm">edit</span>
                                    {upgrading ? 'Upgrading...' : 'Become an Author'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Featured Book */}
                    <div className="relative lg:h-auto flex justify-center items-center">
                        {/* Decorative circles */}
                        <div className="absolute border border-gray-300 rounded-full w-[400px] h-[400px] opacity-30 animate-[spin_10s_linear_infinite]" />
                        <div className="absolute border border-dashed border-primary/30 rounded-full w-[350px] h-[350px] animate-[spin_15s_linear_infinite_reverse]" />

                        {/* Book Cover */}
                        <div className="relative z-10 w-64 md:w-80 bg-white rounded-r-lg rounded-l-sm shadow-book transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500 cursor-pointer group">
                            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-300 to-transparent opacity-20 z-20 rounded-l-sm" />
                            <div className="aspect-[2/3] overflow-hidden rounded-r-lg rounded-l-sm relative">
                                <img
                                    alt="Featured Book Cover"
                                    className="object-cover w-full h-full filter brightness-95 group-hover:brightness-105 transition-all duration-500"
                                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"
                                />
                                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 via-transparent to-transparent text-white">
                                    <span className="text-xs font-bold tracking-widest uppercase text-primary mb-1">
                                        Book of the Month
                                    </span>
                                    <h3 className="font-display text-2xl leading-none mb-1">
                                        The Silent <br />Echo
                                    </h3>
                                    <p className="text-sm text-gray-300">by Eleanor Rigby</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

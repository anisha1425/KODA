import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { authorApi } from '../../lib/api';

export default function CTASection() {
    const navigate = useNavigate();
    const { isAuthenticated, user, openAuthModal, updateUser } = useAuthStore();

    const handleStartPublishing = async () => {
        if (!isAuthenticated) {
            openAuthModal('signup');
            return;
        }

        // If already authenticated, check if role needs upgrade
        if (user?.role === 'reader') {
            try {
                // Auto-upgrade or navigate to author dashboard which handles it
                // For now, let's just go to /author, assuming the dashboard handles the "Become Author" empty state 
                // or we can call the API here.
                const res = await authorApi.becomeAuthor();
                updateUser({ role: res.data.user.role });
                navigate('/author');
            } catch (err) {
                console.error('Become author error:', err);
                navigate('/author'); // Fallback to dashboard
            }
        } else {
            navigate('/author');
        }
    };

    return (
        <section className="py-24 relative overflow-hidden bg-white" id="author">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-background-light skew-x-12 transform translate-x-20" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Images */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="grid grid-cols-2 gap-4">
                            <img
                                alt="Writing"
                                className="rounded-lg shadow-lg transform translate-y-8"
                                src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop"
                            />
                            <img
                                alt="Reading"
                                className="rounded-lg shadow-lg"
                                src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-1/2">
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-main-light mb-6">
                            Empowering Writers
                        </h2>
                        <p className="text-lg text-text-muted-light mb-8 leading-relaxed">
                            Have a story to tell? Publish your novels, comics, or short stories on KODA for free.
                            Reach a global audience, get feedback, and join a supportive community of creators.
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1">
                                    <span className="material-icons-outlined text-sm">check</span>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-semibold">Keep 100% of your rights</h4>
                                    <p className="text-sm text-text-muted-light">
                                        Your work stays yours. We just help you share it.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1">
                                    <span className="material-icons-outlined text-sm">check</span>
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-semibold">Translation Support</h4>
                                    <p className="text-sm text-text-muted-light">
                                        Use our community tools to get your work translated.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleStartPublishing}
                            className="inline-block px-8 py-4 bg-black text-white rounded-lg font-medium shadow-lg hover:bg-gray-800 transition-all duration-300 cursor-pointer text-center"
                        >
                            Start Publishing
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

import { useNavigate } from 'react-router-dom';
import { Smartphone, Laptop, Tablet } from 'lucide-react';
import { useAuthStore } from '../../features/auth/authStore';

export default function AppDownload() {
    const navigate = useNavigate();
    const { isAuthenticated, openAuthModal } = useAuthStore();

    const handleAction = () => {
        if (!isAuthenticated) {
            openAuthModal('signup');
        } else {
            navigate('/search');
        }
    };

    return (
        <section className="py-20 bg-background-light">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

                    <div className="relative z-10 text-center">
                        <h2 className="font-display text-3xl font-bold mb-4">Read Anywhere, Anytime</h2>
                        <p className="text-text-muted-light mb-8 max-w-lg mx-auto">
                            No app download required. Our platform is fully optimized for all your devices.
                            Enjoy a seamless reading experience on your phone, tablet, or laptop.
                        </p>

                        <div className="flex justify-center gap-6 mb-8 text-primary/60">
                            <Smartphone className="w-8 h-8" />
                            <Tablet className="w-8 h-8" />
                            <Laptop className="w-8 h-8" />
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleAction}
                                className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Start Reading Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

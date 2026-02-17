import { useState, useEffect } from 'react';
import { X, Mail, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './authStore';
import { login, register } from './authApi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AuthModal() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthModalOpen, authModalView, closeAuthModal, switchAuthModalView, redirectPath, setRedirectPath } = useAuthStore();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(false);

    // Reset state when modal opens/closes or view changes
    useEffect(() => {
        if (isAuthModalOpen) {
            setError('');
            setShowEmailForm(false);
            setEmail('');
            setPassword('');
            setDisplayName('');
            setConfirmPassword('');
        }
    }, [isAuthModalOpen, authModalView]);

    const handleClose = () => {
        closeAuthModal();
    };

    const handleRedirect = (role: string) => {
        closeAuthModal();
        if (role === 'admin') {
            navigate('/admin');
        } else if (role === 'author') {
            navigate('/author');
        } else {
            // Default user redirection
            if (redirectPath) {
                navigate(redirectPath);
                setRedirectPath(null); // Clear path after use
            } else {
                navigate('/search'); // Default to browse/search page
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (authModalView === 'login') {
                const result = await login({ email, password });
                handleRedirect(result.user.role);
            } else {
                // Registration
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setIsLoading(false);
                    return;
                }

                const result = await register({ displayName, email, password });
                handleRedirect(result.user.role);
            }
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('common.error');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthModalOpen) return null;

    const isLogin = authModalView === 'login';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-display font-bold text-foreground">
                            {isLogin ? 'Log in to Koda' : 'Join Koda'}
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm">
                            {isLogin
                                ? 'Welcome back! Sign in to continue your journey.'
                                : 'Create an account to verify access.'}
                        </p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3 mb-6">
                        <Button
                            variant="outline"
                            className="w-full h-11 justify-center gap-2 bg-white text-black hover:bg-gray-50 border-gray-200 relative"
                            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                            {isLogin ? 'Log in with Google' : 'Sign up with Google'}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-11 justify-center gap-2 bg-white text-black hover:bg-gray-50 border-gray-200"
                            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/github`}
                        >
                            <Github className="w-5 h-5" />
                            {isLogin ? 'Log in with GitHub' : 'Sign up with GitHub'}
                        </Button>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    {/* Email Form Toggle / Form */}
                    {!showEmailForm ? (
                        <Button
                            className="w-full h-11 justify-center gap-2 bg-black text-white hover:bg-gray-900"
                            onClick={() => setShowEmailForm(true)}
                        >
                            <Mail className="w-5 h-5" />
                            {isLogin ? 'Log in with Email' : 'Sign up with Email'}
                        </Button>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {!isLogin && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="h-11"
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Password</label>
                                    {isLogin && (
                                        <a href="#" className="text-xs text-primary hover:underline">
                                            Forgot password?
                                        </a>
                                    )}
                                </div>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="h-11"
                                />
                            </div>

                            {!isLogin && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Confirm Password</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="h-11"
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        'Processing...'
                                    ) : (
                                        isLogin ? 'Log In' : 'Sign Up'
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Footer Toggle */}
                    <div className="mt-8 text-center text-sm">
                        <p className="text-muted-foreground">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => switchAuthModalView(isLogin ? 'signup' : 'login')}
                                className="text-primary hover:underline font-medium focus:outline-none"
                            >
                                {isLogin ? 'Sign up' : 'Log in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

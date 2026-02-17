import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from './authApi';

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await login({ email, password });
            if (result.user.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/');
            }
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('common.error');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <span className="material-icons-outlined text-primary text-4xl">auto_stories</span>
                        <span className="font-display font-bold text-3xl text-text-main-light">
                            KODA
                        </span>
                    </Link>
                    <h1 className="font-display text-3xl font-bold text-text-main-light">
                        Welcome back
                    </h1>
                    <p className="text-text-muted-light mt-2">
                        Sign in to continue your reading journey
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium">Password</label>
                                <a href="#" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-background-light focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm text-text-muted-light">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-center text-text-muted-light mb-4">
                            Or continue with
                        </p>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:border-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span className="material-icons-outlined">email</span>
                                Google
                            </button>
                            <button
                                type="button"
                                className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:border-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span className="material-icons-outlined">code</span>
                                GitHub
                            </button>
                        </div>
                    </div>
                </form>


            </div>
        </div>
    );
}

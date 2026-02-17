import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from './authStore';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginSuccess, redirectPath, setRedirectPath } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Store token and update auth state
            loginSuccess(token);

            // Determine redirect path
            const target = redirectPath || '/search';

            // Clear redirect path
            if (redirectPath) setRedirectPath(null);

            // Navigate
            navigate(target, { replace: true });
        } else {
            // Error handling
            console.error('No token found in callback URL');
            navigate('/login?error=auth_failed', { replace: true });
        }
    }, [searchParams, navigate, loginSuccess, redirectPath, setRedirectPath]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground font-medium">Authenticating...</span>
            </div>
        </div>
    );
}

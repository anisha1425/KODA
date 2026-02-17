import { create } from 'zustand';
import { getCurrentUser } from './authApi';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    displayName: string;
    email: string;
    role: 'reader' | 'author' | 'admin';
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    isAuthModalOpen: boolean;
    authModalView: 'login' | 'signup';
    setAuth: (user: User, token: string) => void;
    updateUser: (updates: Partial<User>) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    openAuthModal: (view?: 'login' | 'signup') => void;
    closeAuthModal: () => void;
    switchAuthModalView: (view: 'login' | 'signup') => void;
    redirectPath: string | null;
    setRedirectPath: (path: string | null) => void;
    loginSuccess: (token: string) => void; // Added loginSuccess to interface
    checkAuth: () => Promise<void>; // Added checkAuth to interface
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({ // Added 'get' to the signature
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false, // Changed initial isLoading to false as per snippet
            error: null, // Initial error state
            isAuthModalOpen: false,
            authModalView: 'login',
            redirectPath: null, // Re-added for clarity, was already present

            // New loginSuccess implementation
            loginSuccess: (token: string) => {
                localStorage.setItem('token', token);
                try {
                    set({ token, isAuthenticated: true, isAuthModalOpen: false, error: null });
                    get().checkAuth(); // Fetch full user details
                } catch (e: unknown) {
                    console.error("Failed to process login success", e);
                    set({ error: (e as Error).message || "Failed to process login success" });
                }
            },

            // Fetch user details
            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const token = get().token || localStorage.getItem('token');

                    if (token) {
                        // Ensure token is set in store if read from localStorage
                        if (!get().token) set({ token });

                        // Fetch user details
                        const user = await getCurrentUser();
                        set({ user, isAuthenticated: true, isLoading: false, error: null });
                    } else {
                        set({ isLoading: false, isAuthenticated: false, user: null, error: null });
                    }
                } catch (e: unknown) {
                    console.error("Auth check failed:", e);
                    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null }); // Don't show error for silent check, just logout
                    localStorage.removeItem('token');
                }
            },

            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true, isLoading: false, isAuthModalOpen: false, error: null });
            },

            updateUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                }));
            },
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            },
            setLoading: (isLoading) => set({ isLoading }),
            openAuthModal: (view = 'login') => set({ isAuthModalOpen: true, authModalView: view }),
            closeAuthModal: () => set({ isAuthModalOpen: false }),
            switchAuthModalView: (view) => set({ authModalView: view }),
            setRedirectPath: (path) => set({ redirectPath: path }),
        }),
        {
            name: 'koda-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                redirectPath: state.redirectPath
            }),
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false);
            },
        }
    )
);

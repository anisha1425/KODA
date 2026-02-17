import api from '../../lib/api';
import { useAuthStore } from './authStore';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterCredentials {
    displayName: string;
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: string;
        displayName: string;
        email: string;
        role: 'reader' | 'author' | 'admin';
        avatarUrl?: string;
    };
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { setAuth } = useAuthStore.getState();
    setAuth(response.data.user, response.data.token);
    return response.data;
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    const { setAuth } = useAuthStore.getState();
    setAuth(response.data.user, response.data.token);
    return response.data;
}

export async function getMe(): Promise<AuthResponse['user']> {
    const response = await api.get<AuthResponse['user']>('/auth/me');
    return response.data;
}

export function logout(): void {
    const { logout: logoutStore } = useAuthStore.getState();
    logoutStore();
}

export async function getCurrentUser() {
    const response = await api.get<{
        id: string;
        displayName: string;
        email: string;
        role: 'reader' | 'author' | 'admin';
        avatarUrl?: string;
    }>('/auth/me');
    return response.data;
}

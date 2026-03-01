import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get token from Zustand persisted state
function getPersistedToken(): string | null {
    try {
        const raw = localStorage.getItem('koda-auth');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.state?.token || null;
    } catch {
        return null;
    }
}

// Request interceptor for auth token
api.interceptors.request.use((config) => {
    const token = getPersistedToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling & retries
interface RetryConfig {
    retryCount?: number;
}

const MAX_RETRIES = 3;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config as (typeof error.config & RetryConfig);

        // 1. Handle auto-retry for Rate Limits (429) and Server Errors (5xx)
        if (error.response && (error.response.status === 429 || error.response.status >= 500)) {
            config.retryCount = config.retryCount || 0;

            if (config.retryCount < MAX_RETRIES) {
                config.retryCount += 1;

                // Calculate delay: prefer Retry-After header, else exponential backoff
                let delay = 1000;
                const retryAfter = error.response.headers['retry-after'];
                if (retryAfter) {
                    delay = parseInt(retryAfter, 10) * 1000 || 1000;
                } else {
                    // Exponential backoff: 1s, 2s, 4s
                    delay = 1000 * Math.pow(2, config.retryCount - 1);
                }

                // Add small jitter to prevent thundering herd
                delay += Math.random() * 200;

                console.warn(`⚠️ API Error ${error.response.status}. Retrying in ${delay}ms (Attempt ${config.retryCount}/${MAX_RETRIES})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return api(config);
            }
        }

        // 2. Handle Auth Errors (401)
        if (error.response?.status === 401) {
            const url = error.config.url || '';
            // Don't redirect for login attempts or admin API calls to avoid loops
            if (!url.includes('/login') && !url.includes('/admin/')) {
                localStorage.removeItem('koda-auth');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (data: { name: string; email: string; password: string }) =>
        api.post('/auth/register', data),
    getProfile: () => api.get('/auth/me'),
};

// Books API
export const booksApi = {
    getAll: (params?: { genre?: string; language?: string; translationGroupId?: string; page?: number; sortBy?: string; limit?: number }) =>
        api.get('/books', { params }),
    getById: (id: string) => api.get(`/books/${id}`),
    getChapters: (bookId: string, params?: { includeContent?: boolean }) =>
        api.get(`/books/${bookId}/chapters`, { params }),
    getChapter: (bookId: string, chapterId: string) =>
        api.get(`/books/${bookId}/chapters/${chapterId}`),
    fetchContent: (bookId: string) => api.post(`/books/${bookId}/fetch-content`),
    getTrending: () => api.get('/books/trending'),
    getRecommended: () => api.get('/books/recommended'),
    getMangadexChapters: (bookId: string, offset?: number) =>
        api.get(`/books/${bookId}/mangadex-chapters`, { params: { offset } }),
    getMangadexPages: (bookId: string, chapterId: string) =>
        api.get(`/books/${bookId}/mangadex-pages/${chapterId}`),
};

// Comics API
// Comics API - Aliased to Books API
export const comicsApi = {
    getAll: (params?: { genre?: string; language?: string; page?: number }) =>
        api.get('/books', { params: { ...params, contentType: 'comic' } }),
    getById: (id: string) => api.get(`/books/${id}`),
    getPages: (comicId: string) => api.get(`/books/${comicId}/chapters`, { params: { includeContent: true } }),
};

// Comments API
export const commentsApi = {
    getByBook: (bookId: string) => api.get(`/books/${bookId}/comments`),
    create: (bookId: string, data: { content: string; parentId?: string }) =>
        api.post(`/books/${bookId}/comments`, data),
    update: (commentId: string, content: string) =>
        api.patch(`/comments/${commentId}`, { content }),
    delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// Reading Progress API
export const progressApi = {
    get: (bookId: string) => api.get(`/books/${bookId}/progress`),
    update: (bookId: string, data: { chapterIndex: number; scrollPosition: number; percentage: number }) =>
        api.put(`/books/${bookId}/progress`, data),
};

// Author API
export const authorApi = {
    becomeAuthor: () => api.post('/users/become-author'),
    getStats: () => api.get('/author/stats'),
    getWorks: () => api.get('/author/works'),
    getComments: (params?: { page?: number }) =>
        api.get('/author/comments', { params }),
    getReviews: (params?: { page?: number }) =>
        api.get('/author/reviews', { params }),
    updateBook: (bookId: string, data: { title?: string; description?: string; genres?: string[]; language?: string }) =>
        api.put(`/author/books/${bookId}`, data),
    togglePublish: (bookId: string) =>
        api.patch(`/author/books/${bookId}/publish`),
    deleteBook: (bookId: string) => api.delete(`/author/books/${bookId}`),
    createBook: (data: FormData) =>
        api.post('/books/upload', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

// Admin API
export const adminApi = {
    getStats: () => api.get('/admin/stats'),
    getContentQueue: (params?: { language?: string; sort?: string; page?: number }) =>
        api.get('/admin/content-queue', { params }),
    approveBook: (bookId: string) => api.patch(`/admin/content/${bookId}/approve`),
    rejectBook: (bookId: string) => api.patch(`/admin/content/${bookId}/reject`),
    flagBook: (bookId: string) => api.patch(`/admin/content/${bookId}/flag`),
    getReports: (params?: { status?: string; page?: number }) =>
        api.get('/admin/reports', { params }),
    reviewReport: (id: string, action: string, adminNote?: string) =>
        api.patch(`/admin/reports/${id}/review`, { action, adminNote }),
    getAuthors: () => api.get('/admin/authors'),
    getUsers: (params?: { page?: number; role?: string }) =>
        api.get('/admin/users', { params }),
    importGutenberg: (gutenbergId: string) => api.post(`/import/gutenberg/${gutenbergId}`),
    importMangadex: (type: 'manga' | 'manhwa', limit: number) => api.post('/import/mangadex', { type, limit }),
};

// Reviews API
export const reviewsApi = {
    getByBook: (bookId: string, params?: { page?: number; limit?: number }) =>
        api.get(`/books/${bookId}/reviews`, { params }),
    create: (bookId: string, data: { rating: number; content?: string }) =>
        api.post(`/books/${bookId}/reviews`, data),
    delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
    getRating: (bookId: string) => api.get(`/books/${bookId}/rating`),
};
// Likes API
export const likesApi = {
    toggle: (targetType: 'book' | 'comment', targetId: string) =>
        api.post('/likes', { targetType, targetId }),
    check: (targetType: 'book' | 'comment', targetIds: string[]) =>
        api.get('/likes/check', { params: { targetType, targetIds: targetIds.join(',') } }),
};

// Notifications API
export const notificationsApi = {
    getAll: (params?: { page?: number; limit?: number }) =>
        api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
};

// Library API (Reading List)
export const libraryApi = {
    getAll: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get('/library', { params }),
    add: (bookId: string, data?: { status?: string; notes?: string }) =>
        api.post(`/library/${bookId}`, data),
    update: (bookId: string, data: { status?: string; notes?: string }) =>
        api.patch(`/library/${bookId}`, data),
    remove: (bookId: string) => api.delete(`/library/${bookId}`),
    check: (bookId: string) => api.get(`/library/check/${bookId}`),
};

// Genres API
export const genresApi = {
    getAll: () => api.get('/genres'),
    getBooks: (slug: string, params?: { page?: number; sortBy?: string }) =>
        api.get(`/genres/${slug}/books`, { params }),
};

// Reports API
export const reportsApi = {
    create: (data: {
        targetType: 'book' | 'comment' | 'user' | 'review';
        targetId: string;
        reason: string;
        description?: string;
    }) => api.post('/reports', data),
};

export default api;


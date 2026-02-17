import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import AdminProtectedRoute from '../features/admin/AdminProtectedRoute';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('../features/home/HomePage'));
const BookDetailPage = lazy(() => import('../features/library/BookDetailPage'));
const ReaderPage = lazy(() => import('../features/reader/ReaderPage'));
const ComicReader = lazy(() => import('../features/reader/ComicReader'));
// Auth pages are now handled by AuthModal, routes redirect to /
const AuthorDashboard = lazy(() => import('../features/author/AuthorDashboard'));
const AdminPanel = lazy(() => import('../features/admin/AdminPanel'));
const SearchPage = lazy(() => import('../features/search/SearchPage'));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'));
const LibraryPage = lazy(() => import('../features/library/LibraryPage'));
const ContactUs = lazy(() => import('../features/support/ContactUs'));
const PrivacyPolicy = lazy(() => import('../features/support/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../features/support/TermsOfService'));

// Loading fallback
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-text-muted-light font-medium">Loading...</span>
        </div>
    </div>
);

const AuthCallback = lazy(() => import('../features/auth/AuthCallback'));

const router = createBrowserRouter([
    {
        path: '/auth/callback',
        element: (
            <Suspense fallback={<PageLoader />}>
                <AuthCallback />
            </Suspense>
        )
    },
    // Main app routes (with Navbar + Footer)
    {
        path: '/',
        element: <Layout><Outlet /></Layout>,
        children: [
            {
                index: true,
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <HomePage />
                    </Suspense>
                ),
            },
            {
                path: 'search',
                element: (
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                            <SearchPage />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'book/:bookId',
                element: (
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                            <BookDetailPage />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'read/:bookId',
                element: (
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                            <ReaderPage />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'comic/:bookId',
                element: (
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                            <ComicReader />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'library',
                element: (
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                            <LibraryPage />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',
                element: (
                    <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}>
                            <ProfilePage />
                        </Suspense>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user/:userId',
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <ProfilePage />
                    </Suspense>
                ),
            },
            {
                path: 'login',
                element: <Navigate to="/" replace />,
            },
            {
                path: 'register',
                element: <Navigate to="/" replace />,
            },

            {
                path: 'support',
                children: [
                    {
                        path: 'contact',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ContactUs />
                            </Suspense>
                        ),
                    },
                    {
                        path: 'privacy',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <PrivacyPolicy />
                            </Suspense>
                        ),
                    },
                    {
                        path: 'terms',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <TermsOfService />
                            </Suspense>
                        ),
                    },
                ]
            },
        ],
    },
    // Author dashboard (standalone layout)
    {
        path: '/author',
        element: (
            <ProtectedRoute allowedRoles={['author', 'admin']}>
                <Suspense fallback={<PageLoader />}>
                    <AuthorDashboard />
                </Suspense>
            </ProtectedRoute>
        ),
    },
    // Admin dashboard (no Navbar/Footer — standalone layout)
    {
        path: '/admin',
        element: (
            <AdminProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                    <AdminPanel />
                </Suspense>
            </AdminProtectedRoute>
        ),
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}

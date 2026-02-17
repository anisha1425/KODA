import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AuthModal from '@/features/auth/AuthModal';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background-light transition-colors duration-300">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
            <AuthModal />
        </div>
    );
}

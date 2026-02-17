import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "../../features/auth/authStore";
import NotificationBell from "@/components/ui/NotificationBell";
import { authorApi } from "../../lib/api";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, updateUser, openAuthModal } = useAuthStore();

    const isAuthorOrAdmin = user?.role === 'author' || user?.role === 'admin';

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        navigate('/');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            openAuthModal('signup');
            return;
        }

        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    const handleBecomeAuthor = async () => {
        if (!isAuthenticated) {
            openAuthModal('login');
            return;
        }

        try {
            const res = await authorApi.becomeAuthor();
            updateUser({ role: res.data.user.role });
            setShowUserMenu(false);
            setIsMenuOpen(false);
            navigate('/author');
        } catch (err) {
            console.error('Become author error:', err);
        }
    };

    const location = useLocation();
    const isSearchPage = location.pathname === '/search';

    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <BookOpen className="h-7 w-7 text-primary" />
                    <span className="font-heading text-xl font-bold text-foreground">
                        KODA
                    </span>
                </Link>

                {/* Desktop Search Bar - Hide on Search Page */}
                {!isSearchPage && (
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search stories, authors, genres..."
                                className="pl-10 bg-secondary border-border"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </form>
                )}

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground"
                        onClick={() => {
                            if (isAuthenticated) {
                                navigate('/search');
                            } else {
                                openAuthModal('login');
                            }
                        }}
                    >
                        Browse
                    </Button>
                    {isAuthenticated && (
                        <Button variant="ghost" size="sm" className="text-foreground" asChild>
                            <Link to="/library">Library</Link>
                        </Button>
                    )}

                    {isAuthenticated && <NotificationBell />}

                    {isAuthenticated && user ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition"
                            >
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-bold">
                                        {user.avatarUrl ? (
                                            <img
                                                src={(user.avatarUrl.startsWith('http') ? user.avatarUrl : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '')}${user.avatarUrl}`)}
                                                alt={user.displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            user.displayName?.charAt(0).toUpperCase() || 'U'
                                        )}
                                    </div>
                                    {isAuthorOrAdmin && (
                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-background flex items-center justify-center" title="Author">
                                            <span className="text-[6px] text-white font-bold">✍</span>
                                        </span>
                                    )}
                                </div>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-52 bg-card rounded-lg shadow-lg py-2 border border-border">
                                    <div className="px-4 py-2 border-b border-border mb-1">
                                        <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                                    </div>
                                    <Link
                                        to="/profile"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                                    >
                                        <span className="material-icons-outlined text-base">person</span>
                                        My Profile
                                    </Link>
                                    {isAuthorOrAdmin ? (
                                        <Link
                                            to="/author"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                                        >
                                            <span className="material-icons-outlined text-base">edit_note</span>
                                            Author Studio
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={handleBecomeAuthor}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                                        >
                                            <span className="material-icons-outlined text-base">upgrade</span>
                                            Become an Author
                                        </button>
                                    )}
                                    {user.role === 'admin' && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                                        >
                                            <span className="material-icons-outlined text-base">admin_panel_settings</span>
                                            Admin Panel
                                        </Link>
                                    )}
                                    <hr className="my-2 border-border" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary"
                                    >
                                        <span className="material-icons-outlined text-base">logout</span>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-foreground"
                                onClick={() => openAuthModal('login')}
                            >
                                Login
                            </Button>
                            <Button
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-accent"
                                onClick={() => openAuthModal('signup')}
                            >
                                <User className="mr-2 h-4 w-4" />
                                Register
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center gap-2">
                    {isAuthenticated && <NotificationBell />}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-foreground"
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="border-t border-border bg-background p-4 md:hidden">
                    {!isSearchPage && (
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search stories..."
                                className="pl-10 bg-secondary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="ghost"
                            className="justify-start text-foreground"
                            onClick={() => {
                                if (isAuthenticated) {
                                    setIsMenuOpen(false);
                                    navigate('/search');
                                } else {
                                    setIsMenuOpen(false);
                                    openAuthModal('login');
                                }
                            }}
                        >
                            Browse
                        </Button>

                        {isAuthenticated && user ? (
                            <>
                                <Button variant="ghost" className="justify-start text-foreground" asChild>
                                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
                                </Button>
                                {isAuthorOrAdmin ? (
                                    <Button variant="ghost" className="justify-start text-foreground" asChild>
                                        <Link to="/author" onClick={() => setIsMenuOpen(false)}>Author Studio</Link>
                                    </Button>
                                ) : (
                                    <button
                                        onClick={handleBecomeAuthor}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded transition-colors text-left"
                                    >
                                        <span className="material-icons-outlined text-base">upgrade</span>
                                        Become an Author
                                    </button>
                                )}
                                {user.role === 'admin' && (
                                    <Button variant="ghost" className="justify-start text-foreground" asChild>
                                        <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
                                    </Button>
                                )}
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="text-left px-4 py-2 text-sm text-destructive hover:bg-secondary rounded"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    className="justify-start text-foreground"
                                    onClick={() => {
                                        openAuthModal('login');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    className="bg-primary text-primary-foreground hover:bg-accent"
                                    onClick={() => {
                                        openAuthModal('signup');
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Register
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

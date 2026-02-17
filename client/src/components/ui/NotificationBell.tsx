import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { useAuthStore } from '@/features/auth/authStore';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { isAuthenticated } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count periodically
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchCount = () => {
            notificationsApi.getUnreadCount()
                .then(res => setUnreadCount(res.data.count))
                .catch(() => { });
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = async () => {
        if (!isOpen) {
            setLoading(true);
            try {
                const res = await notificationsApi.getAll({ page: 1, limit: 10 });
                setNotifications(res.data.notifications || []);
            } catch (err) {
                console.error('Failed to load notifications:', err);
            } finally {
                setLoading(false);
            }
        }
        setIsOpen(!isOpen);
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await notificationsApi.markRead(id);
            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 rounded-full text-text-muted-light hover:text-text-main-light hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-card-light border border-border-light shadow-lg overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
                        <h3 className="font-display font-semibold text-text-main-light">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary hover:text-primary/80 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-14 rounded-lg bg-gray-200 animate-pulse" />
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="mx-auto h-8 w-8 text-text-muted-light/30 mb-2" />
                                <p className="text-sm text-text-muted-light">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <button
                                    key={notification._id}
                                    onClick={() => !notification.isRead && handleMarkRead(notification._id)}
                                    className={`w-full text-left px-4 py-3 border-b border-border-light/50 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {!notification.isRead && (
                                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text-main-light line-clamp-1">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-text-muted-light line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-text-muted-light/60 mt-1">
                                                {timeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

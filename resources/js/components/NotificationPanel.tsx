import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { createCSRFHeaders } from '@/utils/csrf-helper';

interface Notification {
    id: string;
    title: string;
    message: string;
    read_at: string | null;
    created_at: string;
    type: string;
    ticket_id?: number;
    ticket_code?: string;
    ticket_title?: string;
    technical_name?: string;
    assigned_by?: string;
    device_name?: string;
    priority?: string;
}

interface NotificationPanelProps {
    className?: string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Debug logs for state changes
    useEffect(() => {
        console.log('🔔 NotificationPanel: State update - notifications:', notifications.length, 'unread:', unreadCount);
    }, [notifications, unreadCount]);

    // Fetch notifications
    const fetchNotifications = async () => {
        console.log('🔔 NotificationPanel: Iniciando fetchNotifications...');
        setLoading(true);
        try {
            const response = await fetch('/notifications/api', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...createCSRFHeaders(),
                },
                credentials: 'same-origin',
            });

            console.log('🔔 NotificationPanel: Response status:', response.status);
            console.log('🔔 NotificationPanel: Response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('🔔 NotificationPanel: Data received:', data);
                
                if (data.success) {
                    console.log('🔔 NotificationPanel: Setting notifications:', data.notifications?.length || 0);
                    console.log('🔔 NotificationPanel: Setting unread count:', data.unread_count || 0);
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                } else {
                    console.error('🔔 NotificationPanel: API returned success=false:', data);
                }
            } else {
                const errorText = await response.text();
                console.error('🔔 NotificationPanel: HTTP Error:', response.status, errorText);
            }
        } catch (error) {
            console.error('🔔 NotificationPanel: Fetch error:', error);
        } finally {
            setLoading(false);
            console.log('🔔 NotificationPanel: fetchNotifications completed');
        }
    };

    // Mark as read
    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...createCSRFHeaders(),
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                setNotifications(prev => 
                    prev.map(n => 
                        n.id === notificationId 
                            ? { ...n, read_at: new Date().toISOString() }
                            : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Clear notification
    const clearNotification = async (notificationId: string) => {
        try {
            const response = await fetch(`/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...createCSRFHeaders(),
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                const removedNotification = notifications.find(n => n.id === notificationId);
                if (removedNotification && !removedNotification.read_at) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error clearing notification:', error);
        }
    };

    // Load on mount
    useEffect(() => {
        console.log('🔔 NotificationPanel: Componente montado, llamando fetchNotifications...');
        fetchNotifications();
    }, []);

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
        return `${Math.floor(diffInMinutes / 1440)}d`;
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
                title={`${unreadCount} notificaciones sin leer`}
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {unreadCount} sin leer
                                </p>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">
                                    Cargando...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No hay notificaciones</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                                            !notification.read_at ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </h4>
                                                    {notification.priority && (
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {notification.priority}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {notification.ticket_code && (
                                                    <p className="text-xs text-blue-600 font-medium mb-1">
                                                        {notification.ticket_code}
                                                    </p>
                                                )}
                                                
                                                <p className="text-sm text-gray-600 mb-1">
                                                    {notification.message}
                                                </p>
                                                
                                                {/* Información adicional */}
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    {notification.assigned_by && (
                                                        <div>
                                                            <span className="font-medium">Asignado por:</span> {notification.assigned_by}
                                                        </div>
                                                    )}
                                                    {notification.technical_name && (
                                                        <div>
                                                            <span className="font-medium">Técnico asignado:</span> {notification.technical_name}
                                                        </div>
                                                    )}
                                                    {notification.device_name && (
                                                        <div>
                                                            <span className="font-medium">Dispositivo:</span> {notification.device_name}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-medium">Hace:</span> {formatTime(notification.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1 ml-2">
                                                {!notification.read_at && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Marcar como leída"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => clearNotification(notification.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Eliminar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                                <button 
                                    onClick={fetchNotifications}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center"
                                >
                                    Actualizar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                </>
            )}
        </div>
    );
};

export default NotificationPanel;

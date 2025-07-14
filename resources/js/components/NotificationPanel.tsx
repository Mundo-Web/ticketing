import React, { useState } from 'react';
import { Bell, Check, X, Clock, AlertCircle, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
    id: string;
    type: 'ticket_created' | 'ticket_assigned' | 'ticket_comment' | 'ticket_status_changed';
    title: string;
    message: string;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
}

interface NotificationPanelProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClear: (id: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    onClear
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'ticket_created':
                return <FileText className="w-4 h-4 text-blue-500" />;
            case 'ticket_assigned':
                return <User className="w-4 h-4 text-green-500" />;
            case 'ticket_comment':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case 'ticket_status_changed':
                return <Clock className="w-4 h-4 text-purple-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'ticket_created':
                return 'border-l-blue-500 bg-blue-50';
            case 'ticket_assigned':
                return 'border-l-green-500 bg-green-50';
            case 'ticket_comment':
                return 'border-l-yellow-500 bg-yellow-50';
            case 'ticket_status_changed':
                return 'border-l-purple-500 bg-purple-50';
            default:
                return 'border-l-gray-500 bg-gray-50';
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors duration-200"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Notificaciones
                            </h3>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={onMarkAllAsRead}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                                    >
                                        Marcar todas como leídas
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                                Tienes {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                            </p>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-sm">
                                    No tienes notificaciones
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-l-4 hover:bg-gray-50 transition-colors duration-200 ${
                                        notification.read_at 
                                            ? 'bg-white border-l-gray-200' 
                                            : getNotificationColor(notification.type)
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(notification.created_at), 'PPp', { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 ml-2">
                                            {!notification.read_at && (
                                                <button
                                                    onClick={() => onMarkAsRead(notification.id)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                                    title="Marcar como leída"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onClear(notification.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                                title="Eliminar notificación"
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
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center transition-colors duration-200">
                                Ver todas las notificaciones
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default NotificationPanel;

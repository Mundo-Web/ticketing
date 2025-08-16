import { Breadcrumbs } from '@/components/breadcrumbs';
import { Bell, Check } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { format } from 'date-fns';
import { Link } from '@inertiajs/react';
import { useNotifications } from '@/hooks/useNotifications';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
}

interface NotificationIconColors {
    icon: string;
    border: string;
    accent: string;
}

export function AppSidebarHeader({ breadcrumbs = [] }: AppSidebarHeaderProps) {
    const { 
        notifications, 
        unreadCount, 
        isLoading,
        markAsRead 
    } = useNotifications();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const created = new Date(dateString);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return format(created, 'dd MMM');
    };

    const getIconColor = (color?: string): NotificationIconColors => {
        switch (color) {
            case 'green': return {
                icon: 'text-emerald-600 bg-gradient-to-r from-emerald-50 to-green-50',
                border: 'border-emerald-200',
                accent: 'text-emerald-600'
            };
            case 'blue': return {
                icon: 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50',
                border: 'border-blue-200',
                accent: 'text-blue-600'
            };
            case 'red': return {
                icon: 'text-red-600 bg-gradient-to-r from-red-50 to-pink-50',
                border: 'border-red-200',
                accent: 'text-red-600'
            };
            case 'purple': return {
                icon: 'text-purple-600 bg-gradient-to-r from-purple-50 to-violet-50',
                border: 'border-purple-200',
                accent: 'text-purple-600'
            };
            default: return {
                icon: 'text-gray-600 bg-gradient-to-r from-gray-50 to-slate-50',
                border: 'border-gray-200',
                accent: 'text-gray-600'
            };
        }
    };

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-4">
                <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="gap-4 w-10 h-10 px-4 shadow-xl relative hover:shadow-2xl transition-all duration-300 hover:scale-105"
                        >
                            <Bell className="h-6 w-6" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs flex items-center justify-center p-0 notification-badge-pulse border-2 border-white shadow-lg">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[420px] max-h-[520px] mt-4 notification-dropdown shadow-2xl border-0" align="end">
                        <div className="px-4 py-2 rounded-t-lg">
                            <div className="flex items-center justify-between text-primary-foreground">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    <span className="text-lg font-bold">Notificaciones</span>
                                    {unreadCount > 0 && (
                                        <Badge className="bg-primary/20 text-secondary text-xs px-2 py-1 notification-badge-pulse">
                                            {unreadCount} nuevas
                                        </Badge>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => notifications.length > 0 && markAsRead(notifications[0].id)}
                                        className="text-white bg-primary hover:bg-primary text-xs font-medium"
                                    >
                                        Marcar todo como leído
                                    </Button>
                                )}
                            </div>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <Bell className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">¡Todo al día!</h3>
                                <p className="text-sm text-gray-500">No hay notificaciones nuevas</p>
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto notification-scrollbar">
                                <div className="p-2 space-y-1">
                                    {notifications.map((notification) => {
                                        const timeAgo = getTimeAgo(notification.created_at);
                                        const colorScheme = getIconColor(notification.data.color);

                                        return (
                                            <DropdownMenuItem
                                                key={notification.id}
                                                className={`p-0 cursor-pointer group transition-all duration-200 rounded-xl overflow-hidden notification-item ${
                                                    !notification.read_at 
                                                        ? 'bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-200/50 shadow-sm notification-unread' 
                                                        : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50'
                                                }`}
                                                onClick={() => {
                                                    if (!notification.read_at) {
                                                        markAsRead(notification.id);
                                                    }
                                                }}
                                            >
                                                <div className="w-full p-4 flex items-start gap-4">
                                                    <div className={`relative p-3 rounded-xl ${colorScheme.icon} shadow-sm group-hover:shadow-md transition-shadow`}>
                                                        <Bell className="h-5 w-5" />
                                                        {!notification.read_at && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-2 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className={`text-sm font-bold leading-tight ${
                                                                !notification.read_at ? 'text-gray-900' : 'text-gray-700'
                                                            }`}>
                                                                {notification.data.title}
                                                            </h4>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-gray-500 font-medium">
                                                                    {timeAgo}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p className={`text-sm leading-relaxed ${
                                                            !notification.read_at ? 'text-gray-800' : 'text-gray-600'
                                                        }`}>
                                                            {notification.data.message}
                                                        </p>

                                                        {notification.data.type === 'ticket_assigned' && (
                                                            <div className="mt-3 space-y-2">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {notification.data.ticket_code && (
                                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200">
                                                                            <span className="mr-1">🎫</span>
                                                                            {notification.data.ticket_code}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!notification.read_at && (
                                                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsRead(notification.id);
                                                                    }}
                                                                    className="h-8 px-3 text-xs font-medium hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all"
                                                                >
                                                                    <Check className="h-3 w-3 mr-1.5" />
                                                                    Marcar como leído
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {notifications.length > 5 && (
                            <div className="border-t p-2">
                                <Button 
                                    asChild 
                                    variant="ghost" 
                                    className="w-full justify-center text-sm font-medium text-gray-600 hover:text-primary"
                                >
                                    <Link href="/notifications">
                                        Ver todas las notificaciones
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
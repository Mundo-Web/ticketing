import { useState, useEffect } from 'react';
import axios from 'axios';

interface NotificationItem {
    id: string;
    type: string;
    data: {
        type: string;
        ticket_id?: number;
        ticket_code?: string;
        title: string;
        message: string;
        action_url?: string;
        icon?: string;
        color?: string;
        assigned_to?: string;
        assigned_to_id?: number;
        assigned_to_email?: string;
        assigned_by?: string;
        assigned_by_id?: number;
        assigned_by_email?: string;
        created_at: string;
    };
    read_at: string | null;
    created_at: string;
}

interface AppointmentItem {
    id: number;
    title: string;
    description?: string;
    address: string;
    scheduled_for: string;
    status: string;
    ticket: {
        id: number;
        title: string;
        code: string;
    };
}

interface UseNotificationsReturn {
    notifications: NotificationItem[];
    appointments: AppointmentItem[];
    unreadCount: number;
    todayAppointmentsCount: number;
    isLoading: boolean;
    error: Error | null;
    refreshNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchNotifications = async () => {
        try {
            console.log('🔔 AppSidebarHeader: Fetching notifications...');
            setIsLoading(true);
            
            const notificationsResponse = await fetch('/notifications/api');
            if (!notificationsResponse.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const notificationsData = await notificationsResponse.json();
            console.log('🔔 AppSidebarHeader: Notifications received:', notificationsData);
            
            if (notificationsData && notificationsData.notifications) {
                setNotifications(notificationsData.notifications);
                setError(null);
            }

            // Fetch appointments only if the endpoint exists (we can add this later)
            // For now we'll set empty appointments
            setAppointments([]);
            
        } catch (err) {
            console.error('❌ AppSidebarHeader: Error fetching data:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch data'));
            setNotifications([]);
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            console.log('🔔 AppSidebarHeader: Marking notification as read:', id);
            const response = await fetch(`/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // Asegurarse de incluir el token CSRF si Laravel lo requiere
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }

            setNotifications(prev => 
                prev.map(notification => 
                    notification.id === id 
                        ? { ...notification, read_at: new Date().toISOString() }
                        : notification
                )
            );
            console.log('✅ AppSidebarHeader: Notification marked as read:', id);
        } catch (err) {
            console.error('❌ AppSidebarHeader: Failed to mark notification as read:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Set up polling every minute for real-time updates
        const interval = setInterval(fetchNotifications, 60000);
        
        return () => clearInterval(interval);
    }, []);

    // Get unread count from notifications response or calculate it
    const unreadCount = notifications.filter(n => !n.read_at).length;

    // For now, appointments are disabled
    const todayAppointmentsCount = 0;

    return {
        notifications,
        appointments,
        unreadCount,
        todayAppointmentsCount,
        isLoading,
        error,
        refreshNotifications: fetchNotifications,
        markAsRead
    };
}
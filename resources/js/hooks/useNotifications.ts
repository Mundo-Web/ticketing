import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

// Extend Window interface to include Echo
declare global {
    interface Window {
        Echo: any;
    }
}

// Definición del tipo para una notificación
interface NotificationItem {
    id: string;
    data: {
        title: string;
        message: string;
        type: string;
        ticket_code?: string;
        color?: string;
    };
    read_at: string | null;
    created_at: string;
}

// Definición del tipo para el valor de retorno del hook
interface UseNotificationsReturn {
    notifications: NotificationItem[];
    unreadCount: number;
    isLoading: boolean;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

// Hook personalizado para la gestión de notificaciones
export function useNotifications(userId: number | undefined): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Carga inicial de notificaciones
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            console.log('[useNotifications] Fetching initial notifications...');
            const response = await fetch('/notifications/api');
            if (!response.ok) throw new Error('Network response was not ok.');
            
            const data = await response.json();
            if (data.success) {
                console.log('[useNotifications] Initial notifications loaded:', data.notifications.length);
                setNotifications(data.notifications || []);
            } else {
                throw new Error(data.message || 'Failed to fetch notifications');
            }
        } catch (error) {
            console.error("[useNotifications] Failed to fetch notifications:", error);
            toast.error("Could not load notifications.");
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Efecto para la carga inicial
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Efecto para la suscripción a eventos de socket
    useEffect(() => {
        if (!userId) {
            console.log('[useNotifications] No user ID, skipping socket subscription.');
            return;
        }

        if (!window.Echo) {
            console.error('[useNotifications] Laravel Echo not found. Make sure it is initialized.');
            console.error('[useNotifications] Available window properties:', Object.keys(window));
            return;
        }

        console.log(`[useNotifications] Initializing socket subscription for user: ${userId}`);
        console.log('[useNotifications] Echo instance:', window.Echo);

        const pusher = window.Echo.connector.pusher;
        console.log('[useNotifications] Initial Pusher connection state:', pusher.connection.state);

        const setupSubscription = () => {
            console.log(`[useNotifications] Setting up subscription to PUBLIC channel: notifications-public.${userId}`);
            
            // Usar canal público para pruebas
            const channel = window.Echo.channel(`notifications-public.${userId}`);
            
            console.log('📡 [useNotifications] Channel object created:', channel);

            const handleNewNotification = (data: unknown) => {
                console.log('🎉 [useNotifications] New notification received!');
                
                // Manejar diferentes formatos de datos de Laravel
                const eventData = data as any;
                let newNotification;
                
                // Laravel Broadcasting envía la estructura: { notification: { DatabaseNotification } }
                if (eventData.notification) {
                    const notificationData = eventData.notification;
                    
                    // Verificar si tiene la estructura de Laravel DatabaseNotification
                    if (notificationData['Illuminate\\Notifications\\DatabaseNotification']) {
                        const dbNotification = notificationData['Illuminate\\Notifications\\DatabaseNotification'];
                        newNotification = {
                            id: dbNotification.id,
                            data: {
                                title: dbNotification.data.title || 'Nueva notificación',
                                message: dbNotification.data.message || 'Tienes una nueva notificación',
                                type: dbNotification.data.type || 'info',
                                ticket_code: dbNotification.data.ticket_code,
                                color: dbNotification.data.priority === 'high' ? 'red' : 
                                       dbNotification.data.priority === 'medium' ? 'blue' : 'green'
                            },
                            read_at: dbNotification.read_at,
                            created_at: dbNotification.created_at || new Date().toISOString()
                        };
                    } else {
                        // Formato directo del notification - Laravel DatabaseNotification
                        newNotification = {
                            id: notificationData.id || Math.random().toString(),
                            data: {
                                title: notificationData.data?.title || notificationData.title || 'Nueva notificación',
                                message: notificationData.data?.message || notificationData.message || 'Tienes una nueva notificación',
                                type: notificationData.data?.type || notificationData.type || 'info',
                                ticket_code: notificationData.data?.ticket_code || notificationData.ticket_code,
                                color: notificationData.data?.priority === 'high' ? 'red' : 
                                       notificationData.data?.priority === 'medium' ? 'blue' : 'green'
                            },
                            read_at: notificationData.read_at,
                            created_at: notificationData.created_at || new Date().toISOString()
                        };
                    }
                } else if (eventData.data && eventData.data.notification) {
                    // Formato: { data: { notification: {...} } }
                    const innerNotification = eventData.data.notification;
                    newNotification = {
                        id: innerNotification.id || Math.random().toString(),
                        data: {
                            title: innerNotification.title || innerNotification.message || 'Nueva notificación',
                            message: innerNotification.message || 'Tienes una nueva notificación',
                            type: innerNotification.type || 'info',
                            ticket_code: innerNotification.ticket_code,
                            color: innerNotification.color
                        },
                        read_at: innerNotification.read_at,
                        created_at: innerNotification.created_at || new Date().toISOString()
                    };
                } else {
                    // Formato directo: { id: ..., title: ..., message: ... }
                    newNotification = {
                        id: eventData.id || Math.random().toString(),
                        data: {
                            title: eventData.title || eventData.message || 'Nueva notificación',
                            message: eventData.message || 'Tienes una nueva notificación',
                            type: eventData.type || 'info',
                            ticket_code: eventData.ticket_code,
                            color: eventData.color
                        },
                        read_at: eventData.read_at,
                        created_at: eventData.created_at || new Date().toISOString()
                    };
                }
                
                console.log('✅ [useNotifications] Processed notification:', newNotification.data.title);

                setNotifications(prev => {
                    if (prev.find(n => n.id === newNotification.id)) {
                        console.log('[useNotifications] Duplicate notification prevented.');
                        return prev;
                    }
                    console.log('[useNotifications] Adding new notification to state.');
                    return [newNotification, ...prev];
                });

                // Mostrar toast con los datos reales de la notificación
                toast.info(newNotification.data.title, {
                    description: newNotification.data.message,
                    action: {
                        label: "View",
                        onClick: () => router.visit(`/tickets`), 
                    },
                });
            };

            // Debug: Verificar el canal antes de suscribirse
            console.log('🔍 [useNotifications] About to subscribe to channel with name:', `notifications-public.${userId}`);
            console.log('🔍 [useNotifications] Channel instance:', channel);
            console.log('🔍 [useNotifications] Pusher instance:', window.Echo.connector.pusher);
            console.log('🔍 [useNotifications] Available Pusher channels before subscription:', Object.keys(window.Echo.connector.pusher.channels.channels));

            channel.subscribed(() => {
                console.log(`[useNotifications] ✅ Successfully subscribed to channel: notifications-public.${userId}`);
                console.log('[useNotifications] 🎧 Ready to receive real-time notifications!');
                console.log('🔍 [useNotifications] Available Pusher channels after subscription:', Object.keys(window.Echo.connector.pusher.channels.channels));
            });

            console.log('🔧 [useNotifications] ABOUT TO ATTACH LISTENER...');
            
            // Agregar múltiples listeners para debugging
            channel.listen('notification.created', handleNewNotification);
            channel.listen('.notification.created', handleNewNotification); // Con punto
            channel.listen('NotificationCreated', handleNewNotification); // Clase del evento
            
            console.log(`[useNotifications] ✅ Listener attached for event: notification.created`);
            console.log(`[useNotifications] Channel state:`, channel);
            console.log(`[useNotifications] Channel subscription:`, channel.subscription);

            // Debug: Agregar listener a eventos de canal
            channel.error((error: any) => {
                console.error(`[useNotifications] Subscription error for channel notifications-public.${userId}:`, error);
                toast.error("Real-time connection failed. Please refresh.");
            });

            // Debug: Agregar listener directo al canal Pusher
            const pusherChannel = window.Echo.connector.pusher.channels.channels[`notifications-public.${userId}`];
            if (pusherChannel) {
                console.log('🔍 [useNotifications] Adding direct Pusher listener to channel:', `notifications-public.${userId}`);
                pusherChannel.bind('notification.created', function(data: any) {
                    console.log('🌟 [DIRECT PUSHER] Event received:', data);
                    handleNewNotification(data);
                });
            }

            return channel;
        };

        let channel: any = null;
        let cleanup: (() => void) | null = null;

        // Wait for connection to be ready
        if (pusher.connection.state === 'connected') {
            console.log('[useNotifications] Pusher already connected, subscribing immediately.');
            channel = setupSubscription();
        } else {
            console.log('[useNotifications] Waiting for Pusher connection...');
            
            const onConnected = () => {
                console.log('[useNotifications] Pusher connected, setting up subscription.');
                channel = setupSubscription();
            };

            const onDisconnected = () => {
                console.log('[useNotifications] Pusher disconnected.');
            };

            const onError = (error: any) => {
                console.error('[useNotifications] Pusher connection error:', error);
                toast.error("Connection error. Notifications may not work.");
            };

            pusher.connection.bind('connected', onConnected);
            pusher.connection.bind('disconnected', onDisconnected);
            pusher.connection.bind('error', onError);

            cleanup = () => {
                pusher.connection.unbind('connected', onConnected);
                pusher.connection.unbind('disconnected', onDisconnected);
                pusher.connection.unbind('error', onError);
            };
        }

        // Limpieza al desmontar el componente
        return () => {
            console.log(`[useNotifications] Cleaning up subscription for user: ${userId}`);
            
            if (channel) {
                console.log(`[useNotifications] Unsubscribing from channel: notifications.${userId}`);
                window.Echo.leaveChannel(`notifications.${userId}`);
            }
            
            if (cleanup) {
                cleanup();
            }
        };
    }, [userId]);

    // Marcar una notificación como leída
    const markAsRead = (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification || notification.read_at) return;

        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );

        router.post(`/notifications/${id}/read`, {}, {
            preserveState: true,
            preserveScroll: true,
            onError: () => {
                toast.error("Failed to mark as read on server.");
                setNotifications(prev =>
                    prev.map(n => (n.id === id ? { ...n, read_at: null } : n))
                );
            }
        });
    };

    // Marcar todas las notificaciones como leídas
    const markAllAsRead = () => {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        if (unreadIds.length === 0) return;

        setNotifications(prev =>
            prev.map(n => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
        );

        router.post('/notifications/mark-all-as-read', {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success("All notifications marked as read.");
            },
            onError: () => {
                toast.error("Failed to mark all as read on server.");
                fetchNotifications();
            }
        });
    };

    return {
        notifications,
        unreadCount: notifications.filter(n => !n.read_at).length,
        isLoading,
        markAsRead,
        markAllAsRead,
    };
}

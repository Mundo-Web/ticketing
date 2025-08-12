<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Get notifications for the frontend
     */
    public function apiNotifications(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado',
                    'notifications' => [],
                    'unread_count' => 0
                ], 401);
            }

            // Identificar el rol del usuario y obtener las notificaciones correspondientes
            $notifications = $this->getUserNotificationsByRole($user);

            // Transform for frontend
            $transformedNotifications = $notifications->map(function($notification) {
                $data = $notification->data;
                
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => [
                        'type' => $data['type'] ?? 'general',
                        'ticket_id' => $data['ticket_id'] ?? null,
                        'ticket_code' => $data['ticket_code'] ?? null,
                        'title' => $data['title'] ?? 'Notificación',
                        'message' => $data['message'] ?? 'Nueva notificación',
                        'action_url' => $data['action_url'] ?? null,
                        'icon' => $data['icon'] ?? 'bell',
                        'color' => $data['color'] ?? 'gray',
                        'assigned_to' => $data['assigned_to'] ?? null,
                        'assigned_to_id' => $data['assigned_to_id'] ?? null,
                        'assigned_to_email' => $data['assigned_to_email'] ?? null,
                        'assigned_by' => $data['assigned_by'] ?? null,
                        'assigned_by_id' => $data['assigned_by_id'] ?? null,
                        'assigned_by_email' => $data['assigned_by_email'] ?? null,
                        'created_at' => $data['created_at'] ?? $notification->created_at->toISOString(),
                    ],
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at->toISOString(),
                ];
            });

            $unreadCount = $this->getUnreadNotificationsCountByRole($user);

            return response()->json([
                'success' => true,
                'notifications' => $transformedNotifications,
                'unread_count' => $unreadCount,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar notificaciones',
                'notifications' => [],
                'unread_count' => 0
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $notification = $user->notifications()->find($id);
            
            if (!$notification) {
                return response()->json(['success' => false, 'message' => 'Notificación no encontrada'], 404);
            }
            
            $notification->markAsRead();
            
            return response()->json(['success' => true, 'message' => 'Notificación marcada como leída']);
            
        } catch (\Exception $e) {
            Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al marcar como leída'], 500);
        }
    }
    
    /**
     * Delete notification
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $notification = $user->notifications()->find($id);
            
            if (!$notification) {
                return response()->json(['success' => false, 'message' => 'Notificación no encontrada'], 404);
            }
            
            $notification->delete();
            
            return response()->json(['success' => true, 'message' => 'Notificación eliminada']);
            
        } catch (\Exception $e) {
            Log::error('Error deleting notification: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al eliminar notificación'], 500);
        }
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        try {
            $user = Auth::user();
            $user->unreadNotifications->markAsRead();
            
            return response()->json(['success' => true, 'message' => 'Todas las notificaciones marcadas como leídas']);
        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al marcar todas como leídas'], 500);
        }
    }
    
    /**
     * Get notification settings for user
     */
    public function getSettings()
    {
        try {
            $user = Auth::user();
            
            return response()->json([
                'success' => true,
                'settings' => [
                    'email_notifications' => $user->email_notifications ?? true,
                    'push_notifications' => $user->push_notifications ?? true,
                    'notification_frequency' => $user->notification_frequency ?? 'immediate'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting notification settings: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al obtener configuración'], 500);
        }
    }
    
    /**
     * Update notification settings
     */
    public function updateSettings(Request $request)
    {
        try {
            $user = Auth::user();
            
            $request->validate([
                'email_notifications' => 'boolean',
                'push_notifications' => 'boolean',
                'notification_frequency' => 'in:immediate,daily,weekly'
            ]);
            
            $user->update($request->only([
                'email_notifications',
                'push_notifications', 
                'notification_frequency'
            ]));
            
            return response()->json(['success' => true, 'message' => 'Configuración de notificaciones actualizada']);
        } catch (\Exception $e) {
            Log::error('Error updating notification settings: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al actualizar configuración'], 500);
        }
    }

    /**
     * Get notification type
     */
    private function getNotificationType($className)
    {
        if (str_contains($className, 'TicketAssigned')) {
            return 'ticket_assigned';
        } elseif (str_contains($className, 'TicketCreated')) {
            return 'ticket_created';
        } elseif (str_contains($className, 'TicketStatusChanged')) {
            return 'ticket_status_changed';
        } elseif (str_contains($className, 'TicketComment')) {
            return 'ticket_comment';
        }
        
        return 'general';
    }

    /**
     * Get user notifications based on their role
     */
    private function getUserNotificationsByRole($user)
    {
        // Determinar el rol del usuario
        $userRoles = $user->roles->pluck('name')->toArray();
        
        Log::info('User roles for notifications', [
            'user_id' => $user->id,
            'email' => $user->email,
            'roles' => $userRoles
        ]);

        // Si es técnico, buscar notificaciones dirigidas a técnicos por email
        if (in_array('technical', $userRoles) || in_array('technical-leader', $userRoles)) {
            // Buscar notificaciones donde el assigned_to_email coincida con el email del usuario
            // o donde el usuario sea el notifiable directo
            $notifications = DB::table('notifications')
                ->where(function($query) use ($user) {
                    $query->where('notifiable_id', $user->id)
                          ->where('notifiable_type', 'App\\Models\\User');
                })
                ->orWhere(function($query) use ($user) {
                    // Buscar notificaciones donde este usuario es el técnico asignado
                    $query->whereRaw("JSON_EXTRACT(data, '$.assigned_to_email') = ?", [$user->email]);
                })
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function($notification) {
                    // Convertir a objeto Laravel Notification
                    $notificationObj = new \Illuminate\Notifications\DatabaseNotification();
                    $notificationObj->id = $notification->id;
                    $notificationObj->type = $notification->type;
                    $notificationObj->data = json_decode($notification->data, true);
                    $notificationObj->read_at = $notification->read_at;
                    $notificationObj->created_at = \Carbon\Carbon::parse($notification->created_at);
                    $notificationObj->updated_at = \Carbon\Carbon::parse($notification->updated_at);
                    return $notificationObj;
                });

            Log::info('Technical notifications found', [
                'count' => $notifications->count(),
                'user_email' => $user->email
            ]);

            return $notifications;
        }

        // Si es super-admin o admin, obtener todas las notificaciones relevantes
        if (in_array('super-admin', $userRoles) || in_array('admin', $userRoles)) {
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            Log::info('Admin notifications found', [
                'count' => $notifications->count(),
                'user_email' => $user->email
            ]);

            return $notifications;
        }

        // Para otros roles (tenant, owner, doorman), obtener sus notificaciones directas
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        Log::info('General user notifications found', [
            'count' => $notifications->count(),
            'user_email' => $user->email,
            'roles' => $userRoles
        ]);

        return $notifications;
    }

    /**
     * Get unread notifications count based on user role
     */
    private function getUnreadNotificationsCountByRole($user)
    {
        $userRoles = $user->roles->pluck('name')->toArray();

        // Si es técnico, contar notificaciones no leídas dirigidas a técnicos
        if (in_array('technical', $userRoles) || in_array('technical-leader', $userRoles)) {
            $count = DB::table('notifications')
                ->where(function($query) use ($user) {
                    $query->where('notifiable_id', $user->id)
                          ->where('notifiable_type', 'App\\Models\\User');
                })
                ->orWhere(function($query) use ($user) {
                    $query->whereRaw("JSON_EXTRACT(data, '$.assigned_to_email') = ?", [$user->email]);
                })
                ->whereNull('read_at')
                ->count();

            return $count;
        }

        // Para otros roles, usar el método estándar
        return $user->unreadNotifications()->count();
    }
}

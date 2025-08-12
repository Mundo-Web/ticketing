<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

            // Get user notifications
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            // Transform for frontend
            $transformedNotifications = $notifications->map(function($notification) {
                $data = $notification->data;
                
                return [
                    'id' => $notification->id,
                    'title' => $data['ticket_title'] ?? $data['title'] ?? 'Notificación',
                    'message' => $data['message'] ?? 'Nueva notificación',
                    'type' => $this->getNotificationType($notification->type),
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at->toISOString(),
                ];
            });

            $unreadCount = $user->unreadNotifications()->count();

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
}

<?php

namespace App\Services;

use App\Models\User;
use App\Models\Technical;
use App\Models\Ticket;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;

class NotificationDispatcherService
{
    /**
     * Crear notificación de ticket creado
     */
    public function dispatchTicketCreated(Ticket $ticket): void
    {
        Log::info('Dispatching ticket created notifications', ['ticket_id' => $ticket->id]);
        
        // 1. Notificar a todos los admins
        $this->notifyAdmins([
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'ticket_category' => $ticket->category,
            'created_by' => $ticket->user->name ?? 'Unknown User',
            'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
            'message' => "New ticket #{$ticket->code} created: {$ticket->title}",
            'type' => 'ticket_created',
            'priority' => 'medium'
        ]);
        
        // 2. Notificar a técnicos por defecto (pueden asignar tickets)
        $this->notifyDefaultTechnicals([
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'ticket_category' => $ticket->category,
            'created_by' => $ticket->user->name ?? 'Unknown User',
            'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
            'message' => "New ticket #{$ticket->code} requires assignment: {$ticket->title}",
            'type' => 'ticket_created',
            'priority' => 'high'
        ]);
    }
    
    /**
     * Crear notificación de ticket asignado
     */
    public function dispatchTicketAssigned(Ticket $ticket, Technical $technical, User $assignedBy): void
    {
        Log::info('Dispatching ticket assigned notifications', [
            'ticket_id' => $ticket->id,
            'technical_id' => $technical->id,
            'assigned_by' => $assignedBy->id
        ]);
        
        // 1. Notificar al técnico asignado
        $this->notifyTechnical($technical, [
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'technical_name' => $technical->name,
            'assigned_by' => $assignedBy->name,
            'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
            'message' => "Ticket #{$ticket->code} has been assigned to you",
            'type' => 'ticket_assigned',
            'priority' => 'high'
        ]);
        
        // 2. Notificar al usuario que creó el ticket
        if ($ticket->user) {
            $this->notifyUser($ticket->user, [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'technical_name' => $technical->name,
                'assigned_by' => $assignedBy->name,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'message' => "Your ticket #{$ticket->code} has been assigned to {$technical->name}",
                'type' => 'ticket_assigned',
                'priority' => 'medium'
            ]);
        }
        
        // 3. Notificar a admins (excepto quien asignó)
        $this->notifyAdmins([
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'technical_name' => $technical->name,
            'assigned_by' => $assignedBy->name,
            'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
            'message' => "Ticket #{$ticket->code} assigned to {$technical->name} by {$assignedBy->name}",
            'type' => 'ticket_assigned',
            'priority' => 'low'
        ], [$assignedBy->id]);
    }
    
    /**
     * Crear notificación de cambio de estado
     */
    public function dispatchTicketStatusChanged(Ticket $ticket, string $oldStatus, string $newStatus, User $changedBy): void
    {
        Log::info('Dispatching ticket status changed notifications', [
            'ticket_id' => $ticket->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_by' => $changedBy->id
        ]);
        
        // 1. Notificar al usuario que creó el ticket
        if ($ticket->user) {
            $this->notifyUser($ticket->user, [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $changedBy->name,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'message' => "Your ticket #{$ticket->code} status changed from {$oldStatus} to {$newStatus}",
                'type' => 'ticket_status_changed',
                'priority' => $this->getStatusChangePriority($newStatus)
            ]);
        }
        
        // 2. Notificar al técnico asignado (si no es quien cambió el estado)
        if ($ticket->technical && $ticket->technical->email !== $changedBy->email) {
            $this->notifyTechnical($ticket->technical, [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $changedBy->name,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'message' => "Ticket #{$ticket->code} status changed to {$newStatus}",
                'type' => 'ticket_status_changed',
                'priority' => 'medium'
            ]);
        }
        
        // 3. Notificar a admins si es un cambio importante
        if (in_array($newStatus, ['resolved', 'closed', 'cancelled', 'reopened'])) {
            $this->notifyAdmins([
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $changedBy->name,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'message' => "Ticket #{$ticket->code} status changed to {$newStatus} by {$changedBy->name}",
                'type' => 'ticket_status_changed',
                'priority' => 'low'
            ], [$changedBy->id]);
        }
    }
    
    /**
     * Crear notificación de comentario agregado
     */
    public function dispatchTicketCommentAdded(Ticket $ticket, string $comment, User $commentBy): void
    {
        Log::info('Dispatching ticket comment added notifications', [
            'ticket_id' => $ticket->id,
            'comment_by' => $commentBy->id
        ]);
        
        // 1. Notificar al técnico asignado (si no es quien comentó)
        if ($ticket->technical && $ticket->technical->email !== $commentBy->email) {
            $this->notifyTechnical($ticket->technical, [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'comment' => substr($comment, 0, 100) . (strlen($comment) > 100 ? '...' : ''),
                'comment_by' => $commentBy->name,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'message' => "New comment on ticket #{$ticket->code} by {$commentBy->name}",
                'type' => 'ticket_comment',
                'priority' => 'medium'
            ]);
        }
        
        // 2. Notificar al usuario que creó el ticket (si no es quien comentó)
        if ($ticket->user && $ticket->user->id !== $commentBy->id) {
            $this->notifyUser($ticket->user, [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'comment' => substr($comment, 0, 100) . (strlen($comment) > 100 ? '...' : ''),
                'comment_by' => $commentBy->name,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'message' => "New comment on your ticket #{$ticket->code} by {$commentBy->name}",
                'type' => 'ticket_comment',
                'priority' => 'medium'
            ]);
        }
    }
    
    /**
     * Notificar a todos los administradores
     */
    private function notifyAdmins(array $data, array $excludeUserIds = []): void
    {
        $adminUsers = User::role('super-admin')
            ->whereNotIn('id', $excludeUserIds)
            ->get();
        
        foreach ($adminUsers as $user) {
            $this->createDatabaseNotification($user, $data);
        }
    }
    
    /**
     * Notificar a técnicos por defecto
     */
    private function notifyDefaultTechnicals(array $data, array $excludeEmails = []): void
    {
        $defaultTechnicals = Technical::where('is_default', true)
            ->whereNotIn('email', $excludeEmails)
            ->get();
        
        $defaultTechnicalUsers = User::whereIn('email', $defaultTechnicals->pluck('email'))
            ->get();
        
        foreach ($defaultTechnicalUsers as $user) {
            $this->createDatabaseNotification($user, $data);
        }
    }
    
    /**
     * Notificar a un técnico específico
     */
    private function notifyTechnical(Technical $technical, array $data): void
    {
        $technicalUser = User::where('email', $technical->email)->first();
        
        if ($technicalUser) {
            $this->createDatabaseNotification($technicalUser, $data);
        }
    }
    
    /**
     * Notificar a un usuario específico
     */
    private function notifyUser(User $user, array $data): void
    {
        $this->createDatabaseNotification($user, $data);
    }
    
    /**
     * Crear notificación en la base de datos
     */
    private function createDatabaseNotification(User $user, array $data): void
    {
        try {
            DatabaseNotification::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\Notifications\TicketNotification',
                'notifiable_type' => 'App\Models\User',
                'notifiable_id' => $user->id,
                'data' => $data,
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            Log::info('Database notification created', [
                'user_id' => $user->id,
                'type' => $data['type'] ?? 'unknown'
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating database notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Obtener prioridad basada en el cambio de estado
     */
    private function getStatusChangePriority(string $status): string
    {
        return match($status) {
            'resolved', 'closed' => 'high',
            'cancelled' => 'medium',
            'reopened' => 'high',
            'in_progress' => 'medium',
            default => 'low'
        };
    }
}

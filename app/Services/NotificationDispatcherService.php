<?php

namespace App\Services;

use App\Models\User;
use App\Models\Technical;
use App\Models\Ticket;
use App\Events\NotificationCreated;
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

        // Cargar todas las relaciones necesarias
        $ticket->load([
            'user.tenant.apartment.building',
            'device.tenants.apartment.building',
            'device.name_device',
            'technical'
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

        // 4. Notificar a doorman y owner del building cuando el ticket se resuelve
        if ($newStatus === 'resolved') {
            $this->notifyBuildingStaff($ticket, $newStatus, $changedBy);
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
            $notification = DatabaseNotification::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\Notifications\TicketNotification',
                'notifiable_type' => 'App\Models\User',
                'notifiable_id' => $user->id,
                'data' => $data,
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Emitir evento socket para notificación en tiempo real (web)
            Log::info('Broadcasting NotificationCreated event', [
                'user_id' => $user->id,
                'notification_id' => $notification->id,
                'type' => $data['type'] ?? 'unknown'
            ]);
            event(new NotificationCreated($notification, $user->id));

            // El evento MobileNotificationCreated se removió para evitar duplicados
            // El SendPushNotificationListener ya maneja las notificaciones móviles
            // a través del evento NotificationCreated

            Log::info('Database notification created', [
                'user_id' => $user->id,
                'type' => $data['type'] ?? 'unknown',
                'is_member' => $user->hasRole('member')
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating database notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Notificar a doorman y owner del building cuando un ticket se resuelve
     */
    private function notifyBuildingStaff(Ticket $ticket, string $status, User $changedBy): void
    {
        try {
            Log::info('Notifying building staff for resolved ticket', [
                'ticket_id' => $ticket->id,
                'status' => $status
            ]);

            // Buscar el building a través de las relaciones del ticket
            $building = null;
            
            // Opción 1: A través del usuario (member/tenant)
            if ($ticket->user && $ticket->user->tenant && $ticket->user->tenant->apartment) {
                $building = $ticket->user->tenant->apartment->building;
                Log::info('Building found via user->tenant->apartment', [
                    'building_id' => $building?->id,
                    'building_name' => $building?->name
                ]);
            }
            
            // Opción 2: A través del device si no se encontró por usuario
            if (!$building && $ticket->device) {
                // Cargar las relaciones necesarias del device
                $ticket->load('device.tenants.apartment.building');
                
                if ($ticket->device->tenants && $ticket->device->tenants->count() > 0) {
                    $building = $ticket->device->tenants->first()->apartment->building ?? null;
                    Log::info('Building found via device->tenants->apartment', [
                        'building_id' => $building?->id,
                        'building_name' => $building?->name
                    ]);
                }
            }

            if (!$building) {
                Log::warning('No building found for ticket, cannot notify building staff', [
                    'ticket_id' => $ticket->id
                ]);
                return;
            }

            // Preparar datos de la notificación
            $notificationData = [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'status' => $status,
                'changed_by' => $changedBy->name,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'building_name' => $building->name,
                'apartment_name' => $ticket->user->tenant->apartment->name ?? 'Unknown Apartment',
                'member_name' => $ticket->user->name ?? 'Unknown Member',
                'message' => "Ticket #{$ticket->code} in {$building->name} has been resolved",
                'type' => 'ticket_resolved',
                'priority' => 'medium'
            ];

            // Notificar a todos los doorman del building
            $this->notifyBuildingDoormen($building, $notificationData);
            
            // Notificar a todos los owners del building
            $this->notifyBuildingOwners($building, $notificationData);

        } catch (\Exception $e) {
            Log::error('Error notifying building staff', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notificar a todos los doormen del building
     */
    private function notifyBuildingDoormen($building, array $data): void
    {
        try {
            // Buscar doormen asignados a este building
            $doormen = User::role('doorman')
                ->whereHas('doorman', function($query) use ($building) {
                    $query->where('building_id', $building->id);
                })
                ->get();

            Log::info('Found doormen for building', [
                'building_id' => $building->id,
                'doormen_count' => $doormen->count()
            ]);

            foreach ($doormen as $doorman) {
                $doormanData = array_merge($data, [
                    'message' => "🎫 Ticket #{$data['ticket_code']} resolved in your building {$building->name}",
                    'role_context' => 'doorman'
                ]);
                
                $this->createDatabaseNotification($doorman, $doormanData);
                
                Log::info('Doorman notified', [
                    'doorman_id' => $doorman->id,
                    'building_id' => $building->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error notifying doormen', [
                'building_id' => $building->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notificar a todos los owners del building
     */
    private function notifyBuildingOwners($building, array $data): void
    {
        try {
            // Buscar owners asignados a este building
            $owners = User::role('owner')
                ->whereHas('owner', function($query) use ($building) {
                    $query->where('building_id', $building->id);
                })
                ->get();

            Log::info('Found owners for building', [
                'building_id' => $building->id,
                'owners_count' => $owners->count()
            ]);

            foreach ($owners as $owner) {
                $ownerData = array_merge($data, [
                    'message' => "🏢 Ticket #{$data['ticket_code']} resolved in your building {$building->name}",
                    'role_context' => 'owner'
                ]);
                
                $this->createDatabaseNotification($owner, $ownerData);
                
                Log::info('Owner notified', [
                    'owner_id' => $owner->id,
                    'building_id' => $building->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error notifying owners', [
                'building_id' => $building->id,
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

<?php

namespace App\Services;

use App\Models\User;
use App\Models\Technical;
use App\Models\Ticket;
use App\Models\Appointment;
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
        
        // Cargar todas las relaciones necesarias
        $ticket->load([
            'user.tenant.apartment.building',
            'device.name_device',
            'device.brand',
            'device.model'
        ]);
        
        // Preparar datos base del ticket
        $ticketBaseData = [
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'ticket_category' => $ticket->category,
            'ticket_description' => $ticket->description,
            'ticket_status' => $ticket->status,
            'ticket_priority' => $ticket->priority,
            'created_by' => $ticket->user->name ?? 'Unknown User',
            // Client data (campos reales)
            'client_name' => $ticket->user->tenant?->name ?? $ticket->user->name,
            'client_phone' => $ticket->user->tenant?->phone,
            'client_email' => $ticket->user->email,
            // Device data (campos reales)
            'device_id' => $ticket->device->id,
            'device_name' => $ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown Device',
            'device_brand' => $ticket->device->brand->name ?? null,
            'device_model' => $ticket->device->model->name ?? null,
            'device_ubicacion' => $ticket->device->ubicacion,
            // Location data (campos reales)
            'apartment_name' => $ticket->user->tenant?->apartment?->name,
            'apartment_ubicacion' => $ticket->user->tenant?->apartment?->ubicacion,
            'building_name' => $ticket->user->tenant?->apartment?->building?->name,
            'building_address' => $ticket->user->tenant?->apartment?->building?->address,
            'type' => 'ticket_created'
        ];
        
        // 1. Notificar a todos los admins
        $this->notifyAdmins(array_merge($ticketBaseData, [
            'message' => "New ticket #{$ticket->code} created: {$ticket->title}",
            'priority' => 'medium'
        ]));
        
        // 2. Notificar a técnicos por defecto (pueden asignar tickets)
        $this->notifyDefaultTechnicals(array_merge($ticketBaseData, [
            'message' => "New ticket #{$ticket->code} requires assignment: {$ticket->title}",
            'priority' => 'high'
        ]));
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
        
        // Cargar relaciones necesarias
        $ticket->load([
            'user.tenant.apartment.building',
            'device.name_device',
            'device.brand',
            'device.model'
        ]);
        
        // 1. Notificar al técnico asignado
        $this->notifyTechnical($technical, [
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'ticket_category' => $ticket->category,
            'ticket_description' => $ticket->description,
            'ticket_priority' => $ticket->priority,
            'technical_id' => $technical->id,
            'technical_name' => $technical->name,
            'technical_phone' => $technical->phone,
            'technical_email' => $technical->email,
            'technical_shift' => $technical->shift,
            'technical_photo' => $technical->photo,
            'assigned_by' => $assignedBy->name,
            // Device data (campos reales)
            'device_id' => $ticket->device->id,
            'device_name' => $ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown Device',
            'device_brand' => $ticket->device->brand->name ?? null,
            'device_model' => $ticket->device->model->name ?? null,
            'device_ubicacion' => $ticket->device->ubicacion,
            'device_icon' => $ticket->device->icon_id ?? null,
            // Client data (campos reales)
            'client_name' => $ticket->user->tenant?->name ?? $ticket->user->name,
            'client_phone' => $ticket->user->tenant?->phone,
            'client_email' => $ticket->user->email,
            // Location data (campos reales)
            'apartment_name' => $ticket->user->tenant?->apartment?->name,
            'apartment_ubicacion' => $ticket->user->tenant?->apartment?->ubicacion,
            'building_name' => $ticket->user->tenant?->apartment?->building?->name,
            'building_address' => $ticket->user->tenant?->apartment?->building?->address,
            'building_photo' => $ticket->user->tenant?->apartment?->building?->image,
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
                'ticket_category' => $ticket->category,
                'ticket_priority' => $ticket->priority,
                'technical_id' => $technical->id,
                'technical_name' => $technical->name,
                'technical_phone' => $technical->phone,
                'technical_email' => $technical->email,
                'technical_shift' => $technical->shift,
                'technical_photo' => $technical->photo,
                'assigned_by' => $assignedBy->name,
                // Device data (campos reales)
                'device_id' => $ticket->device->id,
                'device_name' => $ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown Device',
                'device_brand' => $ticket->device->brand->name ?? null,
                'device_model' => $ticket->device->model->name ?? null,
                'device_ubicacion' => $ticket->device->ubicacion,
                'device_icon' => $ticket->device->icon_id ?? null,
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
     * Crear notificación de técnico desasignado
     */
    public function dispatchTicketUnassigned(Ticket $ticket, Technical $previousTechnical, User $unassignedBy): void
    {
        Log::info('Dispatching ticket unassigned notifications', [
            'ticket_id' => $ticket->id,
            'previous_technical_id' => $previousTechnical->id,
            'unassigned_by' => $unassignedBy->id
        ]);

        // Cargar todas las relaciones necesarias
        $ticket->load([
            'user.tenant.apartment.building',
            'device.name_device',
            'device.brand',
            'device.model'
        ]);
        
        // 1. Notificar al técnico que fue desasignado
        $this->notifyTechnical($previousTechnical, [
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'ticket_category' => $ticket->category,
            'ticket_priority' => $ticket->priority,
            'technical_id' => $previousTechnical->id,
            'technical_name' => $previousTechnical->name,
            'technical_photo' => $previousTechnical->photo,
            'unassigned_by' => $unassignedBy->name,
            // Device data (campos reales)
            'device_id' => $ticket->device->id,
            'device_name' => $ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown Device',
            'device_brand' => $ticket->device->brand->name ?? null,
            'device_model' => $ticket->device->model->name ?? null,
            'device_ubicacion' => $ticket->device->ubicacion,
            'device_icon' => $ticket->device->icon_id ?? null,
            // Client data (campos reales)
            'client_name' => $ticket->user->tenant?->name ?? $ticket->user->name,
            'client_phone' => $ticket->user->tenant?->phone,
            'message' => "You have been unassigned from ticket #{$ticket->code}",
            'type' => 'ticket_unassigned',
            'priority' => 'medium'
        ]);
        
        // 2. Notificar al usuario que creó el ticket
        if ($ticket->user) {
            $this->notifyUser($ticket->user, [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'ticket_category' => $ticket->category,
                'ticket_priority' => $ticket->priority,
                'previous_technical_name' => $previousTechnical->name,
                'previous_technical_id' => $previousTechnical->id,
                'unassigned_by' => $unassignedBy->name,
                // Device data (campos reales)
                'device_id' => $ticket->device->id,
                'device_name' => $ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown Device',
                'device_brand' => $ticket->device->brand->name ?? null,
                'device_model' => $ticket->device->model->name ?? null,
                'device_ubicacion' => $ticket->device->ubicacion,
                'device_icon' => $ticket->device->icon_id ?? null,
                'message' => "The technician {$previousTechnical->name} has been unassigned from your ticket #{$ticket->code}",
                'type' => 'ticket_unassigned',
                'priority' => 'medium'
            ]);
        }
        
        // 3. Notificar a admins
        $this->notifyAdmins([
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'ticket_title' => $ticket->title,
            'previous_technical_name' => $previousTechnical->name,
            'unassigned_by' => $unassignedBy->name,
            'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
            'message' => "Technician {$previousTechnical->name} unassigned from ticket #{$ticket->code} by {$unassignedBy->name}",
            'type' => 'ticket_unassigned',
            'priority' => 'low'
        ], [$unassignedBy->id]);
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
            'device.name_device',
            'device.brand', 
            'device.model',
            'technical'
        ]);
        
        // 1. Notificar al usuario que creó el ticket
        if ($ticket->user) {
            $this->notifyUser($ticket->user, [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'ticket_title' => $ticket->title,
                'ticket_category' => $ticket->category,
                'ticket_description' => $ticket->description,
                'ticket_priority' => $ticket->priority,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $changedBy->name,
                // Device data (campos reales)
                'device_id' => $ticket->device->id,
                'device_name' => $ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown Device',
                'device_brand' => $ticket->device->brand->name ?? null,
                'device_model' => $ticket->device->model->name ?? null,
                'device_ubicacion' => $ticket->device->ubicacion,
                // Technical data (si está asignado)
                'technical_id' => $ticket->technical?->id,
                'technical_name' => $ticket->technical?->name,
                'technical_phone' => $ticket->technical?->phone,
                'technical_email' => $ticket->technical?->email,
                'technical_shift' => $ticket->technical?->shift,
                'technical_photo' => $ticket->technical?->photo,
                // Device icon
                'device_icon' => $ticket->device->icon_id ?? null,
                // Location data (campos reales)
                'tenant_name' => $ticket->user->tenant?->name,
                'tenant_phone' => $ticket->user->tenant?->phone,
                'apartment_name' => $ticket->user->tenant?->apartment?->name,
                'apartment_ubicacion' => $ticket->user->tenant?->apartment?->ubicacion,
                'building_name' => $ticket->user->tenant?->apartment?->building?->name,
                'building_address' => $ticket->user->tenant?->apartment?->building?->address,
                'building_photo' => $ticket->user->tenant?->apartment?->building?->image,
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
                'ticket_category' => $ticket->category,
                'ticket_priority' => $ticket->priority,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $changedBy->name,
                // Device data (campos reales)
                'device_id' => $ticket->device->id,
                'device_name' => $ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown Device',
                'device_brand' => $ticket->device->brand->name ?? null,
                'device_model' => $ticket->device->model->name ?? null,
                'device_ubicacion' => $ticket->device->ubicacion,
                'device_icon' => $ticket->device->icon ?? null,
                // Client data (campos reales)
                'client_name' => $ticket->user->tenant?->name ?? $ticket->user->name,
                'client_phone' => $ticket->user->tenant?->phone,
                'client_email' => $ticket->user->email,
                // Location data (campos reales) 
                'apartment_name' => $ticket->user->tenant?->apartment?->name,
                'apartment_ubicacion' => $ticket->user->tenant?->apartment?->ubicacion,
                'building_name' => $ticket->user->tenant?->apartment?->building?->name,
                'building_address' => $ticket->user->tenant?->apartment?->building?->address,
                'building_photo' => $ticket->user->tenant?->apartment?->building?->photo,
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
                'device_icon' => $ticket->device->icon_id ?? null,
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
                'device_icon' => $ticket->device->icon_id ?? null,
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
            // 🔍 LOG: Datos antes de crear la notificación
            Log::info('🔔 NOTIFICATION DISPATCHER - Creating Database Notification', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'user_roles' => $user->roles->pluck('name'),
                'notification_type' => $data['type'] ?? 'unknown',
                'notification_data_keys' => array_keys($data),
                'complete_data' => $data
            ]);

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

            // 🔍 LOG: Notificación creada exitosamente
            Log::info('✅ NOTIFICATION DISPATCHER - Database Notification Created', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'notification_type' => $data['type'] ?? 'unknown',
                'will_trigger_push' => $user->hasRole('member') ? 'YES' : 'NO',
                'stored_data' => $notification->data
            ]);

            // Emitir evento socket para notificación en tiempo real (web)
            Log::info('📡 NOTIFICATION DISPATCHER - Broadcasting NotificationCreated Event', [
                'user_id' => $user->id,
                'notification_id' => $notification->id,
                'type' => $data['type'] ?? 'unknown',
                'event_will_trigger_push_listener' => true
            ]);
            
            event(new NotificationCreated($notification, $user->id));

            // El evento MobileNotificationCreated se removió para evitar duplicados
            // El SendPushNotificationListener ya maneja las notificaciones móviles
            // a través del evento NotificationCreated
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
                'technical_photo' => $ticket->technical?->photo,
                'device_name' => $ticket->device->name_device->name ?? 'Unknown Device',
                'device_icon' => $ticket->device->icon_id ?? null,
                'building_name' => $building->name,
                'building_photo' => $building->image,
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

    /**
     * Crear notificación de cita creada
     */
    public function dispatchAppointmentCreated(Appointment $appointment): void
    {
        Log::info('Dispatching appointment created notifications', [
            'appointment_id' => $appointment->id,
            'ticket_id' => $appointment->ticket_id
        ]);

        // Cargar todas las relaciones necesarias
        $appointment->load(['ticket.user.tenant.apartment.building', 'technical']);

        $appointmentDateFormatted = \Carbon\Carbon::parse($appointment->scheduled_for)->format('M d, Y \a\t g:i A');

        // 1. Notificar al técnico asignado
        if ($appointment->technical) {
            $this->notifyTechnical($appointment->technical, [
                'appointment_id' => $appointment->id,
                'appointment_title' => $appointment->title,
                'appointment_address' => $appointment->address,
                'scheduled_for' => $appointment->scheduled_for,
                'appointment_date_formatted' => $appointmentDateFormatted,
                'appointment_status' => $appointment->status,
                'estimated_duration' => $appointment->estimated_duration,
                'ticket_id' => $appointment->ticket->id,
                'ticket_code' => $appointment->ticket->code,
                'ticket_title' => $appointment->ticket->title,
                'client_name' => $appointment->ticket->user->name,
                'client_phone' => $appointment->ticket->user->phone ?? null,
                'building_name' => $appointment->ticket->user->tenant->apartment->building->name ?? 'Unknown Building',
                'apartment_name' => $appointment->ticket->user->tenant->apartment->name ?? 'Unknown Apartment',
                'message' => "New appointment '{$appointment->title}' has been scheduled for {$appointmentDateFormatted}",
                'type' => 'appointment_created',
                'priority' => 'high'
            ]);
        }

        // 2. Notificar al cliente
        if ($appointment->ticket->user) {
            $this->notifyUser($appointment->ticket->user, [
                'appointment_id' => $appointment->id,
                'appointment_title' => $appointment->title,
                'appointment_address' => $appointment->address,
                'scheduled_for' => $appointment->scheduled_for,
                'appointment_date_formatted' => $appointmentDateFormatted,
                'appointment_status' => $appointment->status,
                'estimated_duration' => $appointment->estimated_duration,
                'ticket_id' => $appointment->ticket->id,
                'ticket_code' => $appointment->ticket->code,
                'ticket_title' => $appointment->ticket->title,
                'technical_name' => $appointment->technical->name ?? 'TBD',
                'technical_phone' => $appointment->technical->phone ?? null,
                'technical_speciality' => $appointment->technical->speciality ?? null,
                'message' => "A new appointment '{$appointment->title}' has been scheduled for {$appointmentDateFormatted}",
                'type' => 'appointment_created',
                'priority' => 'medium'
            ]);
        }
    }

    /**
     * Crear notificación de cita iniciada
     */
    public function dispatchAppointmentStarted(Appointment $appointment): void
    {
        Log::info('Dispatching appointment started notifications', [
            'appointment_id' => $appointment->id
        ]);

        $appointment->load(['ticket.user', 'technical']);

        // 1. Notificar al cliente que la cita ha iniciado
        if ($appointment->ticket->user) {
            $this->notifyUser($appointment->ticket->user, [
                'appointment_id' => $appointment->id,
                'appointment_title' => $appointment->title,
                'appointment_address' => $appointment->address,
                'technical_name' => $appointment->technical->name,
                'technical_phone' => $appointment->technical->phone ?? null,
                'ticket_code' => $appointment->ticket->code,
                'message' => "Your appointment '{$appointment->title}' has started with {$appointment->technical->name}",
                'type' => 'appointment_started',
                'priority' => 'high'
            ]);
        }

        // 2. Notificar a admins del cambio
        $this->notifyAdmins([
            'appointment_id' => $appointment->id,
            'appointment_title' => $appointment->title,
            'technical_name' => $appointment->technical->name,
            'client_name' => $appointment->ticket->user->name,
            'ticket_code' => $appointment->ticket->code,
            'message' => "Appointment '{$appointment->title}' started by {$appointment->technical->name}",
            'type' => 'appointment_started',
            'priority' => 'low'
        ]);
    }

    /**
     * Crear notificación de cita completada
     */
    public function dispatchAppointmentCompleted(Appointment $appointment): void
    {
        Log::info('Dispatching appointment completed notifications', [
            'appointment_id' => $appointment->id
        ]);

        $appointment->load(['ticket.user', 'technical']);

        // 1. Notificar al cliente que la cita ha terminado
        if ($appointment->ticket->user) {
            $this->notifyUser($appointment->ticket->user, [
                'appointment_id' => $appointment->id,
                'appointment_title' => $appointment->title,
                'technical_name' => $appointment->technical->name,
                'ticket_code' => $appointment->ticket->code,
                'completion_notes' => $appointment->completion_notes ?? '',
                'message' => "Your appointment '{$appointment->title}' has been completed by {$appointment->technical->name}",
                'type' => 'appointment_completed',
                'priority' => 'medium'
            ]);
        }

        // 2. Notificar a admins
        $this->notifyAdmins([
            'appointment_id' => $appointment->id,
            'appointment_title' => $appointment->title,
            'technical_name' => $appointment->technical->name,
            'client_name' => $appointment->ticket->user->name,
            'ticket_code' => $appointment->ticket->code,
            'message' => "Appointment '{$appointment->title}' completed by {$appointment->technical->name}",
            'type' => 'appointment_completed',
            'priority' => 'low'
        ]);
    }

    /**
     * Crear notificación de cita cancelada
     */
    public function dispatchAppointmentCancelled(Appointment $appointment, string $reason = null): void
    {
        Log::info('Dispatching appointment cancelled notifications', [
            'appointment_id' => $appointment->id,
            'reason' => $reason
        ]);

        $appointment->load(['ticket.user', 'technical']);
        $appointmentDateFormatted = \Carbon\Carbon::parse($appointment->scheduled_for)->format('M d, Y \a\t g:i A');

        // 1. Notificar al técnico
        if ($appointment->technical) {
            $this->notifyTechnical($appointment->technical, [
                'appointment_id' => $appointment->id,
                'appointment_title' => $appointment->title,
                'appointment_date_formatted' => $appointmentDateFormatted,
                'client_name' => $appointment->ticket->user->name,
                'ticket_code' => $appointment->ticket->code,
                'cancellation_reason' => $reason,
                'message' => "Appointment '{$appointment->title}' scheduled for {$appointmentDateFormatted} has been cancelled" . ($reason ? " - Reason: {$reason}" : ""),
                'type' => 'appointment_cancelled',
                'priority' => 'medium'
            ]);
        }

        // 2. Notificar al cliente
        if ($appointment->ticket->user) {
            $this->notifyUser($appointment->ticket->user, [
                'appointment_id' => $appointment->id,
                'appointment_title' => $appointment->title,
                'appointment_date_formatted' => $appointmentDateFormatted,
                'technical_name' => $appointment->technical->name ?? 'Unknown',
                'ticket_code' => $appointment->ticket->code,
                'cancellation_reason' => $reason,
                'message' => "Your appointment '{$appointment->title}' scheduled for {$appointmentDateFormatted} has been cancelled" . ($reason ? " - Reason: {$reason}" : ""),
                'type' => 'appointment_cancelled',
                'priority' => 'high'
            ]);
        }
    }
}

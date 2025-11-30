<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use App\Events\NotificationCreated;
use App\Events\AppointmentRescheduled;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class Appointment extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'ticket_id',
        'technical_id',
        'scheduled_by',
        'title',
        'description',
        'address',
        'scheduled_for',
        'estimated_duration',
        'status',
        'notes',
        'member_instructions',
        'completion_notes',
        'started_at',
        'completed_at',
        'member_feedback',
        'service_rating',
        'no_show_reason',
        'no_show_description',
        'marked_no_show_at',
        'marked_no_show_by'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Boot method para agregar event listeners
     */
    protected static function boot()
    {
        parent::boot();
        
        // Después de cualquier consulta, verificar recordatorios pendientes
        static::retrieved(function ($appointment) {
            $appointment->checkAndSendReminders();
        });
    }

    /**
     * Verificar y enviar recordatorios de citas próximas
     */
    public function checkAndSendReminders()
    {
        // Solo verificar citas programadas
        if ($this->status !== self::STATUS_SCHEDULED) {
            return;
        }

        $appointmentTime = Carbon::parse($this->scheduled_for);
        $now = Carbon::now();
        
        // Solo verificar citas futuras (permitir hasta 1 minuto de retraso)
        if ($appointmentTime->addMinute()->lte($now)) {
            return;
        }

        $minutesUntilAppointment = $now->diffInMinutes($appointmentTime);
        $reminderIntervals = [30, 15, 10, 5, 1];

        foreach ($reminderIntervals as $reminderMinutes) {
            // Verificar si estamos exactamente en el momento del recordatorio (±1 minuto de tolerancia)
            if (abs($minutesUntilAppointment - $reminderMinutes) <= 1) {
                $this->sendReminderNotification($reminderMinutes);
            }
        }
    }

    /**
     * Enviar notificación de recordatorio
     */
    private function sendReminderNotification($minutes)
    {
        // Cache key para evitar enviar el mismo recordatorio múltiples veces
        $cacheKey = "reminder_sent_{$this->id}_{$minutes}";
        
        if (Cache::has($cacheKey)) {
            return; // Ya se envió este recordatorio
        }

        // Cargar las relaciones necesarias
        $this->load(['technical', 'ticket.user']);

        if (!$this->technical || !$this->ticket || !$this->ticket->user) {
            return;
        }

        // Obtener el usuario correspondiente al técnico
        $technicalUser = \App\Models\User::where('email', $this->technical->email)->first();
        if (!$technicalUser) {
            return;
        }

        $timeText = $minutes === 1 ? 'en 1 minuto' : "en {$minutes} minutos";
        $urgency = $minutes <= 2 ? 'high' : 'medium';

        try {
            // Datos para la notificación
            $notificationData = [
                'type' => 'appointment_reminder',
                'title' => '🔔 Appointment Reminder',
                'message' => "Your appointment will begin {$timeText}: {$this->title}",
                'appointment_id' => $this->id,
                'minutes_before' => $minutes,
                'urgency' => $urgency,
                'appointment_title' => $this->title,
                'appointment_address' => $this->address,
                'ticket_code' => $this->ticket->code,
                'scheduled_for' => $this->scheduled_for,
            ];

            // Crear notificación para el técnico EN LA BASE DE DATOS (igual que otras notificaciones)
            $technicalNotification = $technicalUser->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\\Notifications\\AppointmentReminderNotification',
                'data' => array_merge($notificationData, [
                    'message' => "Your appointment as a technician will begin {$timeText}: {$this->title}",
                ]),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Crear notificación para el cliente EN LA BASE DE DATOS
            $clientNotification = $this->ticket->user->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\\Notifications\\AppointmentReminderNotification',
                'data' => array_merge($notificationData, [
                    'message' => "Your appointment as a client will begin {$timeText}: {$this->title}",
                ]),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Emitir eventos igual que las otras notificaciones que funcionan
            event(new NotificationCreated($technicalNotification, $technicalUser->id));
            event(new NotificationCreated($clientNotification, $this->ticket->user->id));

            // Marcar recordatorio como enviado (cache por 1 hora)
            Cache::put($cacheKey, true, 3600);

            Log::info("🔔 Sent automatic reminder for {$minutes} minutes before appointment {$this->id} - Using same pattern as working notifications");

        } catch (\Exception $e) {
            Log::error("Error sending reminder for appointment {$this->id}: " . $e->getMessage());
        }
    }

    // Status constants
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_AWAITING_FEEDBACK = 'awaiting_feedback';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_RESCHEDULED = 'rescheduled';
    public const STATUS_NO_SHOW = 'no_show';

    // Relationships
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function technical()
    {
        return $this->belongsTo(Technical::class);
    }

    public function scheduledBy()
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_for', '>=', Carbon::now())
                    ->whereIn('status', [self::STATUS_SCHEDULED]);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_for', Carbon::today())
                    ->whereIn('status', [self::STATUS_SCHEDULED, self::STATUS_IN_PROGRESS]);
    }

    public function scopeForTechnical($query, $technicalId)
    {
        return $query->where('technical_id', $technicalId);
    }

    public function scopeForTicket($query, $ticketId)
    {
        return $query->where('ticket_id', $ticketId);
    }

    // Accessors & Mutators
    public function getFormattedScheduledForAttribute()
    {
        return $this->scheduled_for ? Carbon::parse($this->scheduled_for)->format('d/m/Y H:i') : null;
    }

    public function getEstimatedEndTimeAttribute()
    {
        return $this->scheduled_for ? 
            Carbon::parse($this->scheduled_for)->addMinutes($this->estimated_duration) : null;
    }

    public function getFormattedEstimatedEndTimeAttribute()
    {
        return $this->estimated_end_time ? $this->estimated_end_time->format('H:i') : null;
    }

    public function getDurationInHoursAttribute()
    {
        return $this->estimated_duration / 60;
    }

    // Helper methods
    public function isUpcoming()
    {
        return Carbon::parse($this->scheduled_for) > Carbon::now() && $this->status === self::STATUS_SCHEDULED;
    }

    public function isToday()
    {
        return Carbon::parse($this->scheduled_for)->isToday() && 
               in_array($this->status, [self::STATUS_SCHEDULED, self::STATUS_IN_PROGRESS]);
    }

    public function canStart()
    {
        return $this->status === self::STATUS_SCHEDULED && 
               Carbon::parse($this->scheduled_for) <= Carbon::now()->addMinutes(15); // Can start 15 minutes early
    }

    public function canComplete()
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function canCancel()
    {
        return in_array($this->status, [self::STATUS_SCHEDULED]);
    }

    public function canReschedule()
    {
        return in_array($this->status, [self::STATUS_SCHEDULED]);
    }

    // Status color helpers for UI
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            self::STATUS_SCHEDULED => 'blue',
            self::STATUS_IN_PROGRESS => 'yellow',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_CANCELLED => 'red',
            self::STATUS_RESCHEDULED => 'gray',
            self::STATUS_NO_SHOW => 'orange',
            default => 'gray'
        };
    }

    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            self::STATUS_SCHEDULED => 'Agendada',
            self::STATUS_IN_PROGRESS => 'En Progreso',
            self::STATUS_COMPLETED => 'Completada',
            self::STATUS_CANCELLED => 'Cancelada',
            self::STATUS_RESCHEDULED => 'Reagendada',
            self::STATUS_NO_SHOW => 'No Show',
            default => $this->status
        };
    }

    // Business logic methods
    public function start()
    {
        if (!$this->canStart()) {
            throw new \Exception('Cannot start this appointment at this time. The appointment must be scheduled and within 15 minutes of the scheduled time.');
        }

        $this->update([
            'status' => self::STATUS_IN_PROGRESS,
            'started_at' => Carbon::now()
        ]);

        // Add history to ticket
        $this->ticket->addHistory(
            'appointment_started',
            "In-person visit initiated by {$this->technical->name}",
            ['appointment_id' => $this->id],
            $this->technical_id
        );

        return $this;
    }

    public function complete($completionNotes = null, $memberFeedback = null, $rating = null)
    {
        if (!$this->canComplete()) {
            throw new \Exception('Cannot complete this appointment in its current state. The appointment must be in progress.');
        }

        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => Carbon::now(),
            'completion_notes' => $completionNotes,
            'member_feedback' => $memberFeedback,
            'rating' => $rating
        ]);

        // Add history to ticket
        $this->ticket->addHistory(
            'appointment_completed',
            "In-person visit completed by {$this->technical->name}" . 
            ($completionNotes ? " - {$completionNotes}" : ''),
            ['appointment_id' => $this->id],
            $this->technical_id
        );

        return $this;
    }

    public function cancel($reason = null)
    {
        if (!$this->canCancel()) {
            throw new \Exception('Cannot cancel this appointment in its current state.');
        }

        $this->update([
            'status' => self::STATUS_CANCELLED,
            'notes' => $this->notes . ($reason ? "\n\nCancelada: {$reason}" : '')
        ]);

        // Add history to ticket
        $this->ticket->addHistory(
            'appointment_cancelled',
            "Cita cancelada" . ($reason ? " - {$reason}" : ''),
            ['appointment_id' => $this->id],
            $this->technical_id
        );

        return $this;
    }

    public function reschedule($newDateTime, $reason = null, $performedBy = null)
    {
        if (!$this->canReschedule()) {
            throw new \Exception('Cannot reschedule this appointment in its current state.');
        }

        // Get the current date string before updating (no Carbon conversion)
        $oldDateString = $this->scheduled_for;
        $newDateString = is_string($newDateTime) ? $newDateTime : $newDateTime->format('Y-m-d H:i:s');
        
        // Crear clave única para prevenir ejecuciones duplicadas
        $rescheduleKey = "reschedule_processing_{$this->id}_{$oldDateString}_{$newDateString}";
        
        // Verificar si ya se está procesando este reagendamiento
        if (\Illuminate\Support\Facades\Cache::has($rescheduleKey)) {
            Log::info("🚫 Reschedule ya en proceso para appointment {$this->id}, evitando duplicado");
            return $this;
        }
        
        // Marcar como en proceso por 10 segundos
        \Illuminate\Support\Facades\Cache::put($rescheduleKey, true, 10);
        
        // Parse dates only for formatting in history (not for storage)
        $oldDateForHistory = Carbon::parse($oldDateString);
        $newDateForHistory = Carbon::parse($newDateString);
        
        $this->update([
            'scheduled_for' => $newDateString, // Store as string, no conversion
            'status' => self::STATUS_SCHEDULED, // Reset to scheduled
            'notes' => $this->notes . ($reason ? "\n\nReagendada: {$reason}" : '')
        ]);

        // Determinar quién realizó la acción
        $currentUser = $performedBy ?: \Illuminate\Support\Facades\Auth::user();
        $currentTechnical = null;
        $actorId = null;
        $actorName = 'System';
        
        if ($currentUser) {
            // Verificar si el usuario actual es un técnico
            $currentTechnical = \App\Models\Technical::where('email', $currentUser->email)->first();
            $actorId = $currentTechnical ? $currentTechnical->id : null;
            $actorName = $currentTechnical ? $currentTechnical->name : $currentUser->name;
        }

        // Add history to ticket - format dates only for display
        $this->ticket->addHistory(
            'appointment_rescheduled',
            "Rescheduled appointment of {$oldDateForHistory->format('d/m/Y H:i')} to {$newDateForHistory->format('d/m/Y H:i')} by {$actorName}" . 
            ($reason ? " - {$reason}" : ''),
            [
                'appointment_id' => $this->id, 
                'old_date' => $oldDateString, 
                'new_date' => $newDateString,
                'actor_name' => $actorName
            ],
            $actorId
        );

        // Disparar el evento AppointmentRescheduled para notificaciones
        Log::info("🔔 Disparando evento AppointmentRescheduled para appointment {$this->id}");
        event(new AppointmentRescheduled($this, $oldDateString, $newDateString));
        
        // Enviar notificaciones directamente para evitar problemas de listeners duplicados
        $this->sendRescheduleNotifications($oldDateString, $newDateString);

        return $this;
    }

    /**
     * Enviar notificaciones de reagendamiento directamente
     */
    private function sendRescheduleNotifications($oldDateTime, $newDateTime)
    {
        // Cargar las relaciones necesarias
        $this->load(['technical', 'ticket.user']);

        if (!$this->technical || !$this->ticket || !$this->ticket->user) {
            Log::warning("Missing technical or member for rescheduled appointment {$this->id}");
            return;
        }

        // Obtener el usuario correspondiente al técnico por email
        $technicalUser = \App\Models\User::where('email', $this->technical->email)->first();
        if (!$technicalUser) {
            Log::warning("No user found for technical email: {$this->technical->email}");
            return;
        }

        Log::info("📅 Appointment rescheduled - sending notifications directly for appointment {$this->id}");
        Log::info("🔄 Rescheduled from {$oldDateTime} to {$newDateTime}");

        try {
            // 1. Crear y enviar notificación de reagendamiento al técnico
            $technicalNotification = new \App\Notifications\AppointmentRescheduledNotification($this, $oldDateTime, $newDateTime, 'technical');
            $technicalUser->notify($technicalNotification);
            Log::info("📧 Technical notification saved to database for user {$technicalUser->id}");
            
            // Obtener la notificación específica que acabamos de crear
            $technicalDatabaseNotification = $technicalUser->notifications()
                ->where('type', 'App\\Notifications\\AppointmentRescheduledNotification')
                ->where('data->appointment_id', $this->id)
                ->where('data->recipient_type', 'technical')
                ->latest()
                ->first();
            
            if ($technicalDatabaseNotification) {
                event(new \App\Events\NotificationCreated($technicalDatabaseNotification, $technicalUser->id));
                Log::info("📡 Technical notification broadcasted for user {$technicalUser->id}");
            }

            // 2. Crear y enviar notificación de reagendamiento al cliente
            $memberNotification = new \App\Notifications\AppointmentRescheduledNotification($this, $oldDateTime, $newDateTime, 'member');
            $this->ticket->user->notify($memberNotification);
            Log::info("📧 Member notification saved to database for user {$this->ticket->user->id}");
            
            // Obtener la notificación específica que acabamos de crear
            $memberDatabaseNotification = $this->ticket->user->notifications()
                ->where('type', 'App\\Notifications\\AppointmentRescheduledNotification')
                ->where('data->appointment_id', $this->id)
                ->where('data->recipient_type', 'member')
                ->latest()
                ->first();
            
            if ($memberDatabaseNotification) {
                event(new \App\Events\NotificationCreated($memberDatabaseNotification, $this->ticket->user->id));
                Log::info("📡 Member notification broadcasted for user {$this->ticket->user->id}");
            }

            Log::info("✅ All reschedule notifications sent successfully for appointment {$this->id}");

        } catch (\Exception $e) {
            Log::error("❌ Error sending reschedule notifications for appointment {$this->id}: " . $e->getMessage());
        }
    }
}
